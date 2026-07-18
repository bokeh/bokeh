from contextlib import asynccontextmanager
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.routing import Mount, Route

from bokeh.embed import server_document
from bokeh.server.asgi import BokehASGI

bokeh_application = BokehASGI({"/": Path(__file__).with_name("bkapp.py")})
template = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True).get_template("index.html")


def render_page(root_path: str = "") -> str:
    mount_url = f"{root_path.rstrip('/')}/bkapp"
    bokeh_script = server_document(mount_url, relative_urls=True)
    return template.render(framework="Starlette", bokeh_script=bokeh_script)


async def index(request: Request) -> HTMLResponse:
    return HTMLResponse(render_page(request.scope.get("root_path", "")))


@asynccontextmanager
async def lifespan(app: Starlette):
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
