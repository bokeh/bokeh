"""One producer supplies immutable snapshots to independent sessions."""

import asyncio
import logging
from dataclasses import dataclass
from math import pi, sin
from threading import Lock

from bokeh.document import Document
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


async def produce(bokeh_application: BokehASGI) -> None:
    phase = 0.0
    while True:
        snapshot = make_snapshot(phase)
        latest.replace(snapshot)

        def update_document(doc: Document) -> None:
            apply_snapshot(doc, snapshot)

        await bokeh_application.update_sessions("/", update_document)
        phase = (phase + 0.12) % (2 * pi)
        await asyncio.sleep(0.1)




def report_producer_failure(task):
    if not task.cancelled() and (error := task.exception()) is not None:
        logging.getLogger(__name__).error("Shared data producer stopped", exc_info=(type(error), error, error.__traceback__))
