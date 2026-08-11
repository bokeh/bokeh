"""Share one background data producer with every local Bokeh session.

Run with::

    python -m uvicorn fastapi_shared_data:app --port 8000
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress
from dataclasses import dataclass
from math import pi, sin
from threading import Lock

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

from bokeh.document import Document
from bokeh.embed import server_document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


@dataclass(frozen=True)
class Snapshot:
    phase: float
    x: tuple[float, ...]
    y: tuple[float, ...]


class Latest:
    """A thread-safe reference read while session documents are constructed."""

    def __init__(self, snapshot: Snapshot) -> None:
        self._lock = Lock()
        self._snapshot = snapshot

    def read(self) -> Snapshot:
        with self._lock:
            return self._snapshot

    def replace(self, snapshot: Snapshot) -> None:
        with self._lock:
            self._snapshot = snapshot


def make_snapshot(phase: float) -> Snapshot:
    x = tuple(index / 25 for index in range(151))
    y = tuple(sin(2 * pi * value + phase) for value in x)
    return Snapshot(phase, x, y)


latest = Latest(make_snapshot(0))


def apply_snapshot(doc: Document, snapshot: Snapshot) -> None:
    source = doc.select_one({"name": "shared-source"})
    phase = doc.select_one({"name": "shared-phase"})
    if not isinstance(source, ColumnDataSource) or not isinstance(phase, Div):
        raise RuntimeError("Shared-data document is missing its named models")
    source.data = {"x": list(snapshot.x), "y": list(snapshot.y)}
    phase.text = f"Server phase: {snapshot.phase:.2f} radians"


def modify_document(doc: Document) -> None:
    """Build one independent document from the producer's latest snapshot."""
    snapshot = latest.read()
    source = ColumnDataSource(
        data={"x": list(snapshot.x), "y": list(snapshot.y)},
        name="shared-source",
    )
    phase = Div(text="", name="shared-phase")
    plot = figure(height=320, sizing_mode="stretch_width", title="One producer, many sessions")
    plot.line("x", "y", source=source, line_width=3)
    doc.add_root(column(phase, plot, sizing_mode="stretch_width"))
    doc.title = "Shared ASGI data"
    apply_snapshot(doc, snapshot)


bokeh_application = BokehASGI({"/": modify_document})


async def produce() -> None:
    phase = 0.0
    while True:
        snapshot = make_snapshot(phase)
        latest.replace(snapshot)

        def update_document(doc: Document) -> None:
            apply_snapshot(doc, snapshot)

        await bokeh_application.update_sessions("/", update_document)
        phase = (phase + 0.12) % (2 * pi)
        await asyncio.sleep(0.1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # The parent owns both lifecycles because mounted applications don't
    # receive lifespan events from FastAPI/Starlette.
    await bokeh_application.core.start()
    producer = asyncio.create_task(produce())
    try:
        yield
    finally:
        producer.cancel()
        with suppress(asyncio.CancelledError):
            await producer
        await bokeh_application.core.stop()


app = FastAPI(lifespan=lifespan)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    root_path = request.scope.get("root_path", "").rstrip("/")
    script = server_document(f"{root_path}/bkapp", relative_urls=True)
    return HTMLResponse(f"""<!doctype html>
<title>Shared Bokeh data</title>
<main style="max-width: 900px; margin: 2rem auto; font-family: sans-serif">
  <h1>One ASGI producer, every Bokeh session</h1>
  <p>Open this page in another tab: both independent sessions receive the same snapshots.</p>
  {script}
</main>
""")


app.mount("/bkapp", bokeh_application)
