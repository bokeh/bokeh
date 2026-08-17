from __future__ import annotations

from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from fourier_studio import modify_document
from jinja2 import Environment, FileSystemLoader

from bokeh.embed import server_document
from bokeh.server.asgi import BokehASGI

type Message = dict[str, Any]
type Receive = Callable[[], Awaitable[Message]]
type Scope = dict[str, Any]
type Send = Callable[[Message], Awaitable[None]]

bokeh_application = BokehASGI(modify_document)
template = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True).get_template("index.html")


def render_page(root_path: str = "") -> bytes:
    mount_url = f"{root_path.rstrip('/')}/bkapp"
    bokeh_script = server_document(mount_url, relative_urls=True)
    return template.render(framework="framework-free ASGI", bokeh_script=bokeh_script).encode()


async def response(send: Send, status: int, body: bytes, *, head: bool = False) -> None:
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            (b"content-type", b"text/html; charset=utf-8"),
            (b"content-length", str(len(body)).encode()),
        ],
    })
    await send({"type": "http.response.body", "body": b"" if head else body})


async def application(scope: Scope, receive: Receive, send: Send) -> None:
    """Dispatch a small site and a mounted Bokeh app using only ASGI."""
    scope_type = scope["type"]
    path = scope.get("path", "")

    if scope_type == "lifespan":
        await bokeh_application(scope, receive, send)
    elif scope_type in ("http", "websocket") and (
        path == "/bkapp" or path.startswith("/bkapp/")
    ):
        mounted_scope = dict(scope)
        mounted_scope["root_path"] = scope.get("root_path", "") + "/bkapp"
        await bokeh_application(mounted_scope, receive, send)
    elif scope_type == "http":
        method = scope["method"].upper()
        if path == "/" and method in ("GET", "HEAD"):
            page = render_page(scope.get("root_path", ""))
            await response(send, 200, page, head=method == "HEAD")
        else:
            await response(send, 404, b"Not found", head=method == "HEAD")
    elif scope_type == "websocket":
        await send({"type": "websocket.close", "code": 1008, "reason": "Not found"})
    else:
        raise RuntimeError(f"Unsupported ASGI scope type {scope_type!r}")
