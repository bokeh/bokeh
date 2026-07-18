from starlette.applications import Starlette
from starlette.responses import HTMLResponse
from starlette.routing import Mount, Route

from bokeh.server.asgi import BokehASGI

from bkapp import application as bkapp


async def index(request):
    return HTMLResponse(
        '<h1>Starlette with Bokeh</h1><iframe src="/bkapp/" width="100%" height="450"></iframe>',
    )


app = Starlette(routes=[
    Route("/", index),
    Mount("/bkapp", BokehASGI({"/": bkapp})),
])
