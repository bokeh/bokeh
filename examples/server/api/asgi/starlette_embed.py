from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fourier_studio import modify_document
from jinja2 import Environment, FileSystemLoader
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.routing import Mount, Route

from bokeh.embed import embed_server
from bokeh.server.asgi import BokehASGI

bokeh_application = BokehASGI(modify_document)
template = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True).get_template("index.html")


def render_page(root_path: str = "") -> str:
    mount_url = f"{root_path.rstrip('/')}/bkapp"
    result = embed_server(mount_url, relative_urls=True)
    fragment = result.fragment(resources="server")
    return template.render(framework="Starlette", embed_html=fragment.html)


async def index(request: Request) -> HTMLResponse:
    return HTMLResponse(render_page(request.scope.get("root_path", "")))


@asynccontextmanager
async def lifespan(_app: Starlette) -> AsyncGenerator[None, None]:
    # Mounted Starlette applications don't receive lifespan events. Start and
    # stop Bokeh from the parent application's lifespan instead.
    await bokeh_application.core.start()
    try:
        yield
    finally:
        await bokeh_application.core.stop()


app = Starlette(routes=[
    Route("/", index),
    Mount("/bkapp", bokeh_application),
], lifespan=lifespan)
