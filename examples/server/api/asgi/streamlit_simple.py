from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import streamlit as st
from fourier_studio import modify_document
from starlette.routing import Mount

from bokeh.server.asgi import BokehASGI

bokeh_application = BokehASGI(modify_document)


@asynccontextmanager
async def lifespan(_app: st.App) -> AsyncGenerator[None, None]:
    # Mounted ASGI applications don't receive lifespan events. Let Streamlit's
    # application lifespan start and stop Bokeh alongside its own runtime.
    await bokeh_application.core.start()
    try:
        yield
    finally:
        await bokeh_application.core.stop()


app = st.App(
    Path(__file__).with_name("streamlit_simple_page.py"),
    routes=[Mount("/bkapp", app=bokeh_application)],
    lifespan=lifespan,
)
