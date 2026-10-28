"""Backend for the React and app-URL live-session examples.

Run from this directory with either transport::

    python -m uvicorn react_mount:app --host 127.0.0.1 --port 8000
    python react_mount.py --tornado --port 8000

The local development token endpoint is deliberately application-owned. A
production host must authenticate token issuance and WebSocket requests.
"""

from __future__ import annotations

import argparse
import json
import os
from collections.abc import Awaitable, Callable
from typing import Any

import numpy as np

from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import (
    ColorBar,
    ColumnDataSource,
    Div,
    LinearColorMapper,
    Select,
    Slider,
)
from bokeh.palettes import Inferno256, Turbo256, Viridis256
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI
from bokeh.util.token import generate_jwt_token, generate_session_id

type Message = dict[str, Any]
type Receive = Callable[[], Awaitable[Message]]
type Send = Callable[[Message], Awaitable[None]]

DEV_ORIGINS = ["localhost:5173", "127.0.0.1:5173"]
if origin := os.environ.get("BOKEH_REACT_ORIGIN"):
    DEV_ORIGINS = [origin]


def modify_document(doc: Document) -> None:
    """Create independent roots belonging to one synchronized session."""
    doc.config.color_scheme = "light"
    controls = Slider(name="controls", title="Second wave amplitude (5 adds a root)", start=0, end=10, value=2, step=1, width=320)
    palettes = {"Viridis": Viridis256, "Inferno": Inferno256, "Turbo": Turbo256}
    colormap = Select(name="colormap", title="Colormap", value="Viridis", options=list(palettes), width=180)
    mapper = LinearColorMapper(name="color_mapper", palette=Viridis256, low=-10, high=10)
    source = ColumnDataSource(name="source", data={"image": []})
    field = figure(title="Two wave sources", width=560, height=400, x_range=(-6, 6), y_range=(-6, 6),
                   tools="pan,wheel_zoom,reset,save", tooltips=[("Amplitude", "@image{0.00}")])
    field.image("image", x=-6, y=-6, dw=12, dh=12, source=source, color_mapper=mapper)
    field.scatter([-2, 2], [0, 0], marker="cross", size=12, line_color="white", line_width=2)
    field.add_layout(ColorBar(color_mapper=mapper), "right")
    field.grid.visible = False
    plot = column(colormap, field, name="plot")
    status = Div(name="status", width=320)
    extra = Div(name="extra", width=320)
    tick = 0
    xs, ys = np.meshgrid(np.linspace(-6, 6, 160), np.linspace(-6, 6, 160))
    left = 2*np.hypot(xs + 2, ys)
    right = 2*np.hypot(xs - 2, ys)

    def update() -> None:
        phase = tick / 3
        image = 4*np.sin(left - phase) + controls.value*np.sin(right - phase)
        source.data = {"image": [image.astype(np.float32)]}
        status.text = f"Server tick: {tick}; amplitude: {controls.value:g}"
        extra.text = f"Python added this root. Server tick: {tick}"
        if controls.value >= 5 and extra not in doc.roots:
            doc.add_root(extra)
        elif controls.value < 5 and extra in doc.roots:
            doc.remove_root(extra)

    def changed(_attr: str, _old: float, _new: float) -> None:
        update()

    def advance() -> None:
        nonlocal tick
        tick += 1
        update()

    def recolor(_attr: str, _old: str, new: str) -> None:
        mapper.palette = palettes[new]

    controls.on_change("value", changed)
    colormap.on_change("value", recolor)
    for root in (controls, plot, status):
        doc.add_root(root)
    doc.title = "Live wave interference"
    update()
    doc.add_periodic_callback(advance, 1000)


def session_bootstrap(root_path: str = "") -> dict[str, str]:
    # This grants a fresh session, and intentionally does not forward HTTP
    # headers/cookies or invoke Application.process_request(). Authentication
    # and request-derived token payloads belong to the enclosing application.
    token = generate_jwt_token(generate_session_id())
    return {"url": f"{root_path.rstrip('/')}/bkapp/ws", "token": token}


bokeh_application = BokehASGI(modify_document, extra_websocket_origins=DEV_ORIGINS)


async def response(send: Send, status: int, body: bytes, *, content_type: str, head: bool = False) -> None:
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            (b"content-type", content_type.encode()),
            (b"content-length", str(len(body)).encode()),
            (b"cache-control", b"no-store"),
        ],
    })
    await send({"type": "http.response.body", "body": b"" if head else body})


async def app(scope: Message, receive: Receive, send: Send) -> None:
    """Host the token endpoint and mount Bokeh without an ASGI framework."""
    scope_type = scope["type"]
    root_path = scope.get("root_path", "").rstrip("/")
    path = scope.get("path", "").removeprefix(root_path)

    if scope_type == "lifespan":
        await bokeh_application(scope, receive, send)
    elif scope_type in ("http", "websocket") and (path == "/bkapp" or path.startswith("/bkapp/")):
        mounted_scope = dict(scope)
        mounted_scope["root_path"] = root_path + "/bkapp"
        await bokeh_application(mounted_scope, receive, send)
    elif scope_type == "http":
        method = scope["method"].upper()
        if method not in ("GET", "HEAD"):
            await response(send, 405, b"GET or HEAD required", content_type="text/plain")
        elif path == "/session":
            body = json.dumps(session_bootstrap(root_path)).encode()
            await response(send, 200, body, content_type="application/json", head=method == "HEAD")
        elif path == "/":
            await response(send, 200, b"Start the React client at http://localhost:5173/", content_type="text/plain", head=method == "HEAD")
        else:
            await response(send, 404, b"Not found", content_type="text/plain", head=method == "HEAD")
    elif scope_type == "websocket":
        await send({"type": "websocket.close", "code": 1008, "reason": "Not found"})
    else:
        raise RuntimeError(f"Unsupported ASGI scope type {scope_type!r}")


def run_tornado(port: int) -> None:
    from tornado.web import RequestHandler

    from bokeh.server.server import Server

    class SessionHandler(RequestHandler):
        def get(self) -> None:
            self.set_header("Cache-Control", "no-store")
            self.write(session_bootstrap())

    server = Server(
        {"/bkapp": modify_document},
        address="127.0.0.1",
        port=port,
        allow_websocket_origin=[*DEV_ORIGINS, f"localhost:{port}", f"127.0.0.1:{port}"],
        extra_patterns=[(r"/session", SessionHandler)],
    )
    server.start()
    try:
        server.io_loop.start()
    finally:
        server.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tornado", action="store_true", required=True)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    run_tornado(args.port)
