from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import streamlit as st
from starlette.routing import Mount

from bokeh.server.asgi import BokehASGI
from examples.server.module_apps.frameworks.control_particles_with_streamlit.simulation import (
    modify_document,
)

bokeh_application = BokehASGI(modify_document)


@asynccontextmanager
async def lifespan(_app: st.App) -> AsyncGenerator[None, None]:
    # Mounted ASGI applications don't receive lifespan events, so the host
    # starts and stops Bokeh alongside Streamlit.
    await bokeh_application.core.start()
    try:
        yield
    finally:
        await bokeh_application.core.stop()


app = st.App(
    Path(__file__).with_name("ui.py"),
    routes=[Mount("/bkapp", app=bokeh_application)],
    lifespan=lifespan,
)
