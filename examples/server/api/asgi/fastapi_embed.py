from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fourier_studio import modify_document
from jinja2 import Environment, FileSystemLoader

from bokeh.embed import server_document
from bokeh.server.asgi import BokehASGI

bokeh_application = BokehASGI(modify_document)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    # Mounted Starlette/FastAPI applications don't receive lifespan events.
    # Start and stop Bokeh from the parent application's lifespan instead.
    await bokeh_application.core.start()
    try:
        yield
    finally:
        await bokeh_application.core.stop()


app = FastAPI(lifespan=lifespan)
template = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True).get_template("index.html")


def render_page(root_path: str = "") -> str:
    mount_url = f"{root_path.rstrip('/')}/bkapp"
    bokeh_script = server_document(mount_url, relative_urls=True)
    return template.render(framework="FastAPI", bokeh_script=bokeh_script)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return HTMLResponse(render_page(request.scope.get("root_path", "")))


app.mount("/bkapp", bokeh_application)
