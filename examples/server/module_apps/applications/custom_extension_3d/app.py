"""Display a three-dimensional surface using a custom extension."""

from pathlib import Path

import numpy as np
from jinja2 import Environment, FileSystemLoader

from bokeh.driving import count
from bokeh.models import ColumnDataSource
from bokeh.server.asgi import BokehASGI

from .surface3d import Surface3d


def modify_document(doc):
    doc.template = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates"), autoescape=True).get_template("index.html")
    x = np.arange(0, 300, 20)
    y = np.arange(0, 300, 20)
    xx, yy = np.meshgrid(x, y)
    xx = xx.ravel()
    yy = yy.ravel()

    def compute(t):
        value = np.sin(xx/50 + t/10) * np.cos(yy/50 + t/10) * 50 + 50
        return dict(x=xx, y=yy, z=value)

    source = ColumnDataSource(data=compute(0))
    surface = Surface3d(x="x", y="y", z="z", data_source=source)
    doc.add_root(surface)

    @count()
    def update(t):
        source.data = compute(t)

    doc.add_periodic_callback(update, 100)
    doc.title = "Surface3d"


app = BokehASGI(modify_document)
