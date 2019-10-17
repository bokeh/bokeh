#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import asyncio
from typing import Optional, Set, Dict, Any
from urllib.parse import urljoin, urlparse, parse_qs

# External imports
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.http import AsyncHttpConsumer
from channels.consumer import AsyncConsumer

from tornado import locks
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.embed.bundle import bundle_for_objs_and_resources, Script
from bokeh.embed.server import server_html_page_for_session
from bokeh.embed.elements import script_for_render_items
from bokeh.embed.util import RenderItem
from bokeh.resources import Resources
from bokeh.server.contexts import ApplicationContext
from bokeh.server.connection import ServerConnection
from bokeh.server.session import ServerSession
from bokeh.server.views.static_handler import StaticHandler
from bokeh.server.protocol_handler import ProtocolHandler
from bokeh.protocol import Protocol
from bokeh.protocol.receiver import Receiver
from bokeh.protocol.message import Message
from bokeh.core.templates import AUTOLOAD_JS
from bokeh.util.session_id import generate_session_id, check_session_id_signature

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocConsumer',
    'AutoloadJsConsumer',
    'WSConsumer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class ConsumerHelper(AsyncConsumer):

    _prefix = "/"

    @property
    def request(self) -> "AttrDict":
        request = AttrDict(self.scope)
        request["arguments"] = self.arguments
        return request

    @property
    def arguments(self) -> Dict[str, str]:
        parsed_url = urlparse("/?" + self.scope["query_string"].decode())
        return {name: value for name, [value] in parse_qs(parsed_url.query).items()}

    def get_argument(self, name: str, default: Optional[str] = None) -> Optional[str]:
        return self.arguments.get(name, default)

    def resources(self, absolute_url: Optional[str] = None) -> Resources:
        root_url = urljoin(absolute_url, self._prefix) if absolute_url else self._prefix
        return Resources(mode="server", root_url=root_url, path_versioner=StaticHandler.append_version)

class SessionConsumer(AsyncHttpConsumer, ConsumerHelper):

    application_context: ApplicationContext

    def __init__(self, scope: Dict[str, Any]) -> None:
        super(SessionConsumer, self).__init__(scope)

        kwargs = self.scope["url_route"]["kwargs"]
        self.application_context = kwargs["app_context"]

        # XXX: accessing asyncio's IOLoop directly doesn't work
        if self.application_context.io_loop is None:
            self.application_context._loop = IOLoop.current()

    async def _get_session(self) -> ServerSession:
        session_id = generate_session_id(secret_key=None, signed=False)
        session = await self.application_context.create_session_if_needed(session_id, self.request)
        return session

class AutoloadJsConsumer(SessionConsumer):

    async def handle(self, body: bytes) -> None:
        session = await self._get_session()

        element_id = self.get_argument("bokeh-autoload-element", default=None)
        if not element_id:
            raise RuntimeError("No bokeh-autoload-element query parameter")

        app_path = self.get_argument("bokeh-app-path", default="/")
        absolute_url = self.get_argument("bokeh-absolute-url", default=None)

        server_url: Optional[str]
        if absolute_url:
            server_url = '{uri.scheme}://{uri.netloc}/'.format(uri=urlparse(absolute_url))
        else:
            server_url = None

        resources_param = self.get_argument("resources", "default")
        resources = self.resources(server_url) if resources_param != "none" else None
        bundle = bundle_for_objs_and_resources(None, resources)

        render_items = [RenderItem(sessionid=session.id, elementid=element_id, use_for_title=False)]
        bundle.add(Script(script_for_render_items(None, render_items, app_path=app_path, absolute_url=absolute_url)))

        js = AUTOLOAD_JS.render(bundle=bundle, elementid=element_id)
        await self.send_response(200, js.encode(), headers=[(b"Content-Type", b"application/javascript")])

class DocConsumer(SessionConsumer):

    async def handle(self, body: bytes) -> None:
        session = await self._get_session()
        page = server_html_page_for_session(session,
                                            resources=self.resources(),
                                            title=session.document.title,
                                            template=session.document.template,
                                            template_variables=session.document.template_variables)
        await self.send_response(200, page.encode(), headers=[(b"Content-Type", b"text/html")])

class WSConsumer(AsyncWebsocketConsumer, ConsumerHelper):

    _clients: Set[ServerConnection]

    application_context: ApplicationContext

    def __init__(self, scope: Dict[str, Any]) -> None:
        super(WSConsumer, self).__init__(scope)

        kwargs = self.scope['url_route']["kwargs"]
        self.application_context = kwargs["app_context"]

        if self.application_context.io_loop is None:
            raise RuntimeError("io_loop should already been set")

        self._clients = set()
        self.lock = locks.Lock()

    async def connect(self):
        log.info('WebSocket connection opened')

        proto_version = self.get_argument("bokeh-protocol-version")
        if proto_version is None:
            self.close()
            raise RuntimeError("No bokeh-protocol-version specified")

        session_id = self.get_argument("bokeh-session-id")
        if session_id is None:
            self.close()
            raise RuntimeError("No bokeh-session-id specified")

        if not check_session_id_signature(session_id,
                                          signed=False,
                                          secret_key=None):
            log.error("Session id had invalid signature: %r", session_id)
            raise RuntimeError("Invalid session ID")

        def on_fully_opened(future):
            e = future.exception()
            if e is not None:
                # this isn't really an error (unless we have a
                # bug), it just means a client disconnected
                # immediately, most likely.
                log.debug("Failed to fully open connlocksection %r", e)

        future = self._async_open(session_id, proto_version)

        # rewrite above line using asyncio
        # this task is scheduled to run soon once context is back to event loop
        task = asyncio.ensure_future(future)
        task.add_done_callback(on_fully_opened)
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data) -> None:
        fragment = text_data

        message = await self.receiver.consume(fragment)
        if message:
            work = await self.handler.handle(message, self.connection)
            if work:
                await self._send_bokeh_message(work)

    async def _async_open(self, session_id: str, proto_version: str) -> None:
        try:
            await self.application_context.create_session_if_needed(session_id, self.request)
            session = self.application_context.get_session(session_id)

            protocol = Protocol(proto_version)
            self.receiver = Receiver(protocol)
            log.debug("Receiver created for %r", protocol)

            self.handler = ProtocolHandler()
            log.debug("ProtocolHandler created for %r", protocol)

            self.connection = self._new_connection(protocol, self, self.application_context, session)
            log.info("ServerConnection created")

        except Exception as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise e

        msg = self.connection.protocol.create('ACK')
        await self._send_bokeh_message(msg)

    async def _send_bokeh_message(self, message: Message) -> int:
        sent = 0
        try:
            async with self.lock:
                await self.send(text_data=message.header_json)
                sent += len(message.header_json)

                await self.send(text_data=message.metadata_json)
                sent += len(message.metadata_json)

                await self.send(text_data=message.content_json)
                sent += len(message.content_json)

                for header, payload in message._buffers:
                    await self.send(text_data=json.dumps(header))
                    await self.send(bytes_data=payload)
                    sent += len(header) + len(payload)
        except Exception:  # Tornado 4.x may raise StreamClosedError
            # on_close() is / will be called anyway
            log.warn("Failed sending message as connection was closed")
        return sent

    def _new_connection(self,
            protocol: Protocol,
            socket: AsyncConsumer,
            application_context: ApplicationContext,
            session: ServerSession) -> ServerConnection:
        connection = AsyncServerConnection(protocol, socket, application_context, session)
        self._clients.add(connection)
        return connection

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# TODO: remove this when Python 2.x is dropped
class AsyncServerConnection(ServerConnection):

    async def send_patch_document(self, event):
        """ Sends a PATCH-DOC message, returning a Future that's completed when it's written out. """
        msg = self.protocol.create('PATCH-DOC', [event])
        await self._socket._send_bokeh_message(msg)

class AttrDict(dict):
    """ Provide a dict subclass that supports access by named attributes.

    """

    def __getattr__(self, key):
        return self[key]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
