from fastapi import FastAPI
from fastapi.responses import HTMLResponse

from bokeh.server.asgi import BokehASGI

from bkapp import application as bkapp


app = FastAPI()


@app.get("/", response_class=HTMLResponse)
async def index():
    return '<h1>FastAPI with Bokeh</h1><iframe src="/bkapp/" width="100%" height="450"></iframe>'


# FastAPI delegates HTTP, websocket, and lifespan events below this mount.
app.mount("/bkapp", BokehASGI({"/": bkapp}))
