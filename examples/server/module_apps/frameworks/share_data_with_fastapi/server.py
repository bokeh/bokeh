"""Share one background data producer with every local Bokeh session.

Run with::

    python -m uvicorn examples.server.module_apps.frameworks.share_data_with_fastapi.server:app --port 8000
"""

from __future__ import annotations

# Standard library imports
import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

# Bokeh imports
from bokeh.embed import embed_server
from bokeh.server.asgi import BokehASGI
# External imports
from examples.server.module_apps.updating_data.share_data_between_sessions.app import (
    modify_document, produce as produce_shared, report_producer_failure)

bokeh_application = BokehASGI({"/": modify_document})


async def produce() -> None:
    await produce_shared(bokeh_application)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # The parent owns both lifecycles because mounted applications don't
    # receive lifespan events from FastAPI/Starlette.
    await bokeh_application.core.start()
    producer = asyncio.create_task(produce())
    producer.add_done_callback(report_producer_failure)
    try:
        yield
    finally:
        producer.cancel()
        try:
            with suppress(asyncio.CancelledError):
                await producer
        finally:
            await bokeh_application.core.stop()


app = FastAPI(lifespan=lifespan)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    root_path = request.scope.get("root_path", "").rstrip("/")
    result = embed_server(f"{root_path}/bkapp", relative_urls=True)
    fragment = result.fragment(resources="server")
    return HTMLResponse(f"""<!doctype html>
<title>Shared Bokeh data</title>
<main style="max-width: 900px; margin: 2rem auto; font-family: sans-serif">
  <h1>One ASGI producer, every Bokeh session</h1>
  <p>Open this page in another tab: both independent sessions receive the same snapshots.</p>
  {fragment.html}
</main>
""")


app.mount("/bkapp", bokeh_application)
