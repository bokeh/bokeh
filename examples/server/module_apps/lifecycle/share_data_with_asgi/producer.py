"""Publish shared snapshots from an async host-owned task."""

import asyncio
import logging
from math import pi

from bokeh.document import Document
from bokeh.server.asgi import BokehASGI
from examples.server.module_apps.updating_data.share_data_between_sessions.app import (
    apply_snapshot,
    latest,
    make_snapshot,
)


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
