#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A framework-neutral ASGI frontend for Bokeh server applications. '''

from __future__ import annotations

import asyncio
import binascii
import calendar
import datetime as dt
import html
import json
import logging
import mimetypes
import zlib
from http.cookies import SimpleCookie
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast
from urllib.parse import parse_qs, urlparse

from ..core.templates import AUTOLOAD_JS
from ..embed.bundle import Script, bundle_for_objs_and_resources, extension_dirs
from ..embed.elements import script_for_render_items
from ..embed.server import server_html_page_for_session
from ..embed.util import RenderItem
from ..protocol import Protocol
from ..protocol.exceptions import MessageError, ProtocolError, ValidationError
from ..protocol.message import Message
from ..protocol.receiver import Receiver
from ..settings import settings
from ..util.token import check_token_signature, get_session_id, get_token_payload
from .auth import AuthPolicy
from .core import BokehServerCore, SessionError
from .protocol_handler import ProtocolHandler
from .request import Cookie, Headers, ServerRequest
from .util import check_allowlist

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, Mapping

    from ..application import Application
    from ..application.handlers.function import ModifyDoc
    from ..core.types import ID, PathLike
    from .connection import ServerConnection
    from .contexts import ApplicationContext

    type Scope = dict[str, Any]
    type Event = dict[str, Any]
    type Receive = Callable[[], Awaitable[Event]]
    type Send = Callable[[Event], Awaitable[None]]

log = logging.getLogger(__name__)

__all__ = ("BokehASGI",)


class _WriteLock:
    ''' Adapt an asyncio lock to the historical ``with await lock.acquire()`` API. '''

    def __init__(self) -> None:
        self._lock = asyncio.Lock()

    async def acquire(self) -> _WriteLock:
        await self._lock.acquire()
        return self

    def __enter__(self) -> None:
        return None

    def __exit__(self, *args: object) -> None:
        self._lock.release()


class _ASGIWebSocketTransport:
    def __init__(self, send: Send, *, supports_close_reason: bool) -> None:
        self._send = send
        self._supports_close_reason = supports_close_reason
        self.write_lock = _WriteLock()
        self.closed = False

    async def send_message(self, message: Message[Any]) -> None:
        if not self.closed:
            try:
                await message.send(self)
            except OSError:
                # ASGI servers raise OSError when the peer has disconnected.
                # The corresponding websocket.disconnect event may still be
                # waiting for the application to receive it.
                self.closed = True

    async def write_message(self, message: bytes | str, binary: bool = False, locked: bool = True) -> None:
        if self.closed:
            return
        if locked:
            with await self.write_lock.acquire():
                await self.write_message(message, binary=binary, locked=False)
            return
        if binary:
            data = message if isinstance(message, bytes) else message.encode("utf-8")
            await self._send({"type": "websocket.send", "bytes": data})
        else:
            text = message.decode("utf-8") if isinstance(message, bytes) else message
            await self._send({"type": "websocket.send", "text": text})

    def ping(self, data: bytes) -> None:
        # ASGI deliberately has no portable ping-frame event. ASGI servers
        # provide transport-level keepalive configuration instead.
        pass

    async def close(self, code: int = 1000, reason: str = "") -> None:
        if not self.closed:
            self.closed = True
            event: Event = {"type": "websocket.close", "code": code}
            if self._supports_close_reason:
                event["reason"] = reason
            try:
                await self._send(event)
            except OSError:
                pass


class BokehASGI:
    ''' Host one or more Bokeh applications using the standard ASGI protocol.

    This class does not depend on an ASGI framework or server. It can be
    served directly by Uvicorn or Hypercorn, or mounted in another ASGI app.
    Applications may be supplied as :class:`~bokeh.application.application.Application`
    objects, document-modifying callables, or paths to Bokeh application
    scripts. Script paths are executed once for every new session. Supply an
    :class:`~bokeh.server.auth.AuthPolicy` to authenticate dynamic HTTP and
    websocket requests without depending on an ASGI framework.
    '''

    def __init__(
        self,
        applications: Mapping[str, Application | ModifyDoc | PathLike] | Application | ModifyDoc | PathLike,
        *,
        prefix: str | None = None,
        redirect_root: bool = True,
        auth_policy: AuthPolicy | None = None,
        **kwargs: Any,
    ) -> None:
        if auth_policy is not None and auth_policy.logout_url is not None:
            kwargs.setdefault("logout_url", auth_policy.logout_url)
        self._core = BokehServerCore(applications, prefix=prefix, **kwargs)
        self._redirect_root = redirect_root
        self._auth_policy = auth_policy
        self._start_lock: asyncio.Lock | None = None

    @property
    def core(self) -> BokehServerCore:
        return self._core

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        scope_type = scope["type"]
        if scope_type == "lifespan":
            await self._lifespan(receive, send)
        elif scope_type == "http":
            await self._ensure_started()
            await self._http(scope, receive, send)
        elif scope_type == "websocket":
            await self._ensure_started()
            await self._websocket(scope, receive, send)
        else:
            raise RuntimeError(f"Unsupported ASGI scope type {scope_type!r}")

    async def _ensure_started(self) -> None:
        if self._start_lock is None:
            self._start_lock = asyncio.Lock()
        async with self._start_lock:
            await self._core.start()

    async def _lifespan(self, receive: Receive, send: Send) -> None:
        while True:
            event = await receive()
            if event["type"] == "lifespan.startup":
                try:
                    await self._ensure_started()
                except Exception as error:
                    await send({"type": "lifespan.startup.failed", "message": str(error)})
                    return
                await send({"type": "lifespan.startup.complete"})
            elif event["type"] == "lifespan.shutdown":
                await self._core.stop()
                self._start_lock = None
                await send({"type": "lifespan.shutdown.complete"})
                return

    async def _http(self, scope: Scope, receive: Receive, send: Send) -> None:
        request = self._request(scope)
        route = self._route_path(scope)
        method = request.method.upper()

        if not route:
            await self._response(send, 404, b"Not found", "text/plain", head=method == "HEAD")
            return

        if route.startswith("/static/"):
            if method not in ("GET", "HEAD"):
                await self._method_not_allowed(send, ("GET", "HEAD"))
                return
            root_context = self._core.applications.get("/")
            root = root_context.application.static_path if root_context is not None else None
            if root is not None:
                await self._static(send, root, route.removeprefix("/static/"), head=method == "HEAD")
            elif route.startswith("/static/extensions/"):
                relative = route.removeprefix("/static/extensions/")
                name, separator, artifact = relative.partition("/")
                await self._static(send, extension_dirs.get(name), artifact if separator else "", head=method == "HEAD")
            else:
                await self._static(
                    send,
                    Path(settings.bokehjs_path()),
                    route.removeprefix("/static/"),
                    head=method == "HEAD",
                )
            return

        if route == "/" and "/" not in self._core.applications:
            if method not in ("GET", "HEAD"):
                await self._method_not_allowed(send, ("GET", "HEAD"))
                return
            if await self._authenticate_http(request, send, head=method == "HEAD"):
                await self._root(request, send, head=method == "HEAD")
            return

        resolved = self._resolve_application(route)
        if resolved is None:
            await self._response(send, 404, b"Not found", "text/plain", head=method == "HEAD")
            return
        context, suffix = resolved

        if suffix.startswith("/static/"):
            if method not in ("GET", "HEAD"):
                await self._method_not_allowed(send, ("GET", "HEAD"))
                return
            await self._static(send, context.application.static_path, suffix.removeprefix("/static/"), head=method == "HEAD")
            return
        if suffix == "/autoload.js" and method == "OPTIONS":
            await self._response(send, 204, b"", "text/plain", extra_headers=self._cors_headers(request))
            return
        if suffix not in ("", "/", "/metadata", "/autoload.js"):
            await self._response(send, 404, b"Not found", "text/plain", head=method == "HEAD")
            return
        if method not in ("GET", "HEAD"):
            allowed = ("GET", "HEAD", "OPTIONS") if suffix == "/autoload.js" else ("GET", "HEAD")
            await self._method_not_allowed(send, allowed)
            return
        if not await self._authenticate_http(request, send, head=method == "HEAD"):
            return

        if suffix in ("", "/"):
            await self._document(context, request, send, head=method == "HEAD")
        elif suffix == "/metadata":
            await self._metadata(context, send, head=method == "HEAD")
        else:
            await self._autoload(context, request, send, head=method == "HEAD")

    async def _document(self, context: ApplicationContext, request: ServerRequest, send: Send, *, head: bool) -> None:
        try:
            session = await self._core.create_session(context, request)
        except SessionError as error:
            await self._response(send, error.status, error.reason.encode(), "text/plain", head=head)
            return
        page = server_html_page_for_session(
            session,
            resources=self._core.resources(root_path=request.root_path),
            title=session.document.title,
            template=session.document.template,
            template_variables=session.document.template_variables,
        )
        await self._response(send, 200, page.encode(), "text/html; charset=UTF-8", head=head)

    async def _metadata(self, context: ApplicationContext, send: Send, *, head: bool) -> None:
        data = context.application.metadata
        if callable(data):
            data = data()
        body = json.dumps({"url": context.url, "data": data or {}}).encode()
        await self._response(send, 200, body, "application/json", head=head)

    async def _autoload(self, context: ApplicationContext, request: ServerRequest, send: Send, *, head: bool) -> None:
        try:
            session = await self._core.create_session(context, request)
        except SessionError as error:
            await self._response(send, error.status, error.reason.encode(), "text/plain", head=head)
            return
        element_id = self._argument(request, "bokeh-autoload-element")
        if not element_id:
            await self._response(send, 400, b"No bokeh-autoload-element query parameter", "text/plain", head=head)
            return
        app_path = self._argument(request, "bokeh-app-path") or "/"
        absolute_url = self._argument(request, "bokeh-absolute-url")
        server_url = None
        if absolute_url:
            uri = urlparse(absolute_url)
            server_url = f"{uri.scheme}://{uri.netloc}"
        resources = None if self._argument(request, "resources") == "none" else self._core.resources(
            server_url, root_path=request.root_path,
        )
        bundle = bundle_for_objs_and_resources(None, resources)
        render_items = [RenderItem(token=session.token, elementid=cast("ID", element_id), use_for_title=False)]
        bundle.add(Script(script_for_render_items({}, render_items, app_path=app_path, absolute_url=absolute_url)))
        body = AUTOLOAD_JS.render(bundle=bundle, elementid=element_id).encode()
        await self._response(
            send, 200, body, "application/javascript", head=head, extra_headers=self._cors_headers(request),
        )

    async def _root(self, request: ServerRequest, send: Send, *, head: bool) -> None:
        paths = sorted(self._core.app_paths)
        base = request.root_path.rstrip("/") + self._core.prefix
        if self._redirect_root and len(paths) == 1:
            await self._response(send, 302, b"", "text/plain", head=head, extra_headers=[(b"location", (base + paths[0]).encode())])
            return
        items = "".join(
            f'<li><a href="{html.escape(base + path)}">{html.escape(path)}</a></li>' for path in paths
        )
        body = f"<!doctype html><title>Bokeh applications</title><h1>Bokeh applications</h1><ul>{items}</ul>".encode()
        await self._response(send, 200, body, "text/html; charset=UTF-8", head=head)

    async def _static(self, send: Send, root: str | Path | None, relative: str, *, head: bool) -> None:
        if root is None or not relative:
            await self._response(send, 404, b"Not found", "text/plain", head=head)
            return
        root_path = Path(root).resolve()
        path = (root_path / relative).resolve()
        if not path.is_relative_to(root_path) or not path.is_file():
            await self._response(send, 404, b"Not found", "text/plain", head=head)
            return
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        size = (await asyncio.to_thread(path.stat)).st_size
        headers = [(b"content-type", content_type.encode()), (b"content-length", str(size).encode())]
        await send({"type": "http.response.start", "status": 200, "headers": headers})
        if head:
            await send({"type": "http.response.body", "body": b""})
            return

        stream = await asyncio.to_thread(path.open, "rb")
        try:
            while chunk := await asyncio.to_thread(stream.read, 64*1024):
                await send({"type": "http.response.body", "body": chunk, "more_body": True})
        finally:
            await asyncio.to_thread(stream.close)
        await send({"type": "http.response.body", "body": b""})

    async def _websocket(self, scope: Scope, receive: Receive, send: Send) -> None:
        transport = _ASGIWebSocketTransport(
            send,
            supports_close_reason=self._supports_websocket_close_reason(scope),
        )
        event = await receive()
        if event["type"] == "websocket.disconnect":
            return
        if event["type"] != "websocket.connect":
            await transport.close(1002, "Expected websocket.connect")
            return

        route = self._route_path(scope)
        if not route:
            await transport.close(1008, "Unknown Bokeh application")
            return
        resolved = self._resolve_application(route)
        if resolved is None or resolved[1] != "/ws":
            await transport.close(1008, "Unknown Bokeh application")
            return
        context, _ = resolved
        subprotocols = scope.get("subprotocols", [])
        if len(subprotocols) != 2 or subprotocols[0] != "bokeh":
            await transport.close(1002, "Bokeh subprotocol and token required")
            return
        token = subprotocols[1]
        if not self._valid_websocket_token(token):
            await transport.close(1008, "Invalid or expired token")
            return
        request = self._request(scope)
        if not self._origin_allowed(request):
            await transport.close(1008, "Origin is not allowed")
            return
        if not await self._authenticate(request):
            await transport.close(1008, "Authentication required")
            return

        try:
            await send({"type": "websocket.accept", "subprotocol": "bokeh"})
        except OSError:
            transport.closed = True
            return
        connection: ServerConnection | None = None
        try:
            session_id = get_session_id(token)
            session = await self._core.create_session_if_needed(context, session_id, request, token)
            protocol = Protocol()
            receiver = Receiver(protocol)
            handler = ProtocolHandler()
            connection = self._core.new_connection(protocol, transport, context, session)
            await transport.send_message(protocol.create("ACK"))

            while True:
                event = await receive()
                if event["type"] == "websocket.disconnect":
                    break
                if event["type"] != "websocket.receive":
                    continue
                fragment = event.get("bytes")
                if fragment is None:
                    fragment = event.get("text")
                if fragment is None:
                    continue
                message = await receiver.consume(fragment)
                if message is not None:
                    work = await handler.handle(message, connection)
                    if isinstance(work, Message):
                        await transport.send_message(work)
                    elif work is not None:
                        raise ProtocolError(f"expected a Message not {work!r}")
        except (MessageError, ProtocolError, ValidationError) as error:
            log.error("Bokeh websocket protocol error: %s", error)
            await transport.close(1002, str(error))
        except Exception:
            log.exception("Bokeh websocket internal error")
            await transport.close(1011, "Bokeh server internal error")
        finally:
            transport.closed = True
            if connection is not None and getattr(connection, "_session", None) is not None:
                connection.session.notify_connection_lost()
                self._core.client_lost(connection)

    def _request(self, scope: Scope) -> ServerRequest:
        header_values: dict[str, str] = {}
        for raw_name, raw_value in scope.get("headers", []):
            # ASGI requires response header names to be lower-case and strongly
            # recommends the same for request headers, but applications can be
            # hosted behind adapters that preserve their original casing. Use
            # a canonical key so repeated headers are combined regardless of
            # how those adapters cased each occurrence.
            name = raw_name.decode("latin-1").lower()
            value = raw_value.decode("latin-1")
            separator = "; " if name == "cookie" else ", "
            header_values[name] = separator.join(filter(None, (header_values.get(name), value)))
        headers = Headers(header_values)
        cookie = SimpleCookie()
        if value := headers.get("cookie"):
            cookie.load(value)
        cookies = {name: Cookie(morsel.value) for name, morsel in cookie.items()}
        query_bytes = scope.get("query_string", b"")
        query = query_bytes.decode("latin-1")
        arguments = {
            name: [value.encode("latin-1") for value in values]
            for name, values in parse_qs(
                query,
                keep_blank_values=True,
                encoding="latin-1",
                errors="strict",
            ).items()
        }
        path = scope.get("path", "/")
        client = scope.get("client")
        host = headers.get("host", "")
        return ServerRequest(
            method=scope.get("method", "GET"),
            uri=f"{path}?{query}" if query else path,
            path=path,
            arguments=arguments,
            headers=headers,
            cookies=cookies,
            remote_ip=client[0] if client else None,
            protocol=scope.get("scheme", "http"),
            host=host,
            query=query,
            root_path=scope.get("root_path", ""),
            user=scope.get("user"),
            state=scope.get("state") or {},
        )

    async def _authenticate(self, request: ServerRequest) -> bool:
        if self._auth_policy is None:
            return True
        request.user = await self._auth_policy.authenticate(request)
        return request.user is not None

    async def _authenticate_http(self, request: ServerRequest, send: Send, *, head: bool) -> bool:
        if await self._authenticate(request):
            return True
        assert self._auth_policy is not None
        if (login_url := self._auth_policy.get_login_url(request)) is not None:
            await self._response(
                send,
                302,
                b"",
                "text/plain",
                head=head,
                extra_headers=[(b"location", login_url.encode())],
            )
        else:
            await self._response(send, 401, b"Authentication required", "text/plain", head=head)
        return False

    def _route_path(self, scope: Scope) -> str:
        path = scope.get("path", "/")
        root_path = scope.get("root_path", "").rstrip("/")
        if root_path and (path == root_path or path.startswith(root_path + "/")):
            path = path[len(root_path):] or "/"
        prefix = self._core.prefix
        if prefix:
            if path == prefix:
                return "/"
            if not path.startswith(prefix + "/"):
                return ""
            path = path[len(prefix):]
        return path or "/"

    def _resolve_application(self, route: str) -> tuple[ApplicationContext, str] | None:
        for path in sorted(self._core.applications, key=len, reverse=True):
            base = "" if path == "/" else path
            if route == base or route == base + "/" or route.startswith(base + "/"):
                return self._core.applications[path], route[len(base):]
        return None

    def _valid_websocket_token(self, token: str) -> bool:
        try:
            if not check_token_signature(token, signed=self._core.sign_sessions, secret_key=self._core.secret_key):
                return False
            session_id = get_session_id(token)
            payload = get_token_payload(token)
        except (AttributeError, binascii.Error, json.JSONDecodeError, KeyError, TypeError, UnicodeError, zlib.error):
            return False
        expiry = payload.get("session_expiry")
        now = calendar.timegm(dt.datetime.now(tz=dt.UTC).timetuple())
        return isinstance(session_id, str) and bool(session_id) and isinstance(expiry, int) and now < expiry

    @staticmethod
    def _supports_websocket_close_reason(scope: Scope) -> bool:
        version = scope.get("asgi", {}).get("spec_version", "2.0")
        try:
            major, minor = (int(part) for part in version.split(".", 1))
        except (AttributeError, TypeError, ValueError):
            return False
        return (major, minor) >= (2, 3)

    def _origin_allowed(self, request: ServerRequest) -> bool:
        origin = request.headers.get("origin")
        if origin is None:
            return True
        origin_host = urlparse(origin).netloc.lower()
        allowed = set(settings.allowed_ws_origin()) or self._core.websocket_origins
        if not allowed:
            return origin_host == request.host.lower()
        return check_allowlist(origin_host, [pattern.lower() for pattern in allowed])

    def _cors_headers(self, request: ServerRequest) -> list[tuple[bytes, bytes]]:
        origin = request.headers.get("origin")
        allow_origin = origin if origin is not None and self._origin_allowed(request) else "*"
        headers = [
            (b"access-control-allow-origin", allow_origin.encode()),
            (b"access-control-allow-headers", b"*"),
            (b"access-control-allow-credentials", b"true"),
            (b"access-control-allow-methods", b"GET, HEAD, OPTIONS"),
        ]
        if allow_origin != "*":
            headers.append((b"vary", b"Origin"))
        return headers

    @staticmethod
    def _argument(request: ServerRequest, name: str) -> str | None:
        values = request.arguments.get(name)
        return values[-1].decode("utf-8") if values else None

    @staticmethod
    async def _method_not_allowed(send: Send, allowed: tuple[str, ...]) -> None:
        await BokehASGI._response(
            send,
            405,
            b"Method not allowed",
            "text/plain",
            extra_headers=[(b"allow", ", ".join(allowed).encode())],
        )

    @staticmethod
    async def _response(
        send: Send,
        status: int,
        body: bytes,
        content_type: str,
        *,
        head: bool = False,
        extra_headers: list[tuple[bytes, bytes]] | None = None,
    ) -> None:
        headers: list[tuple[bytes, bytes]] = []
        if not (100 <= status < 200 or status in (204, 304)):
            headers.extend([
                (b"content-type", content_type.encode()),
                (b"content-length", str(len(body)).encode()),
            ])
        headers.extend(extra_headers or ())
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": b"" if head else body})
