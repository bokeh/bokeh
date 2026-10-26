"""Apply image filters and compare their results."""

import numpy as np
import scipy.datasets
from scipy.ndimage import correlate

from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.palettes import gray
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


def blur(image, size):
    """Keep the original example's window offset and unchanged border."""
    totals = correlate(image, np.ones((size, size), dtype=np.int64), output=np.int64)
    result = image.copy()
    result[size:-size, size:-size] = totals[size-1:-size-1, size-1:-size-1] / (size*size)
    return result


def modify_document(doc):
    image = scipy.datasets.ascent().astype(np.int32)[::-1, :]

    w, h = image.shape

    source = ColumnDataSource(data=dict(image=[image]))

    p = figure(x_range=(0, w), y_range=(0, h))

    p.image('image', x=0, y=0, dw=w, dh=h, palette=gray(256), source=source)

    def update(attr, old, new):
        out = blur(image, 2*new + 1)
        source.data.update(image=[out])

    slider = Slider(title="Blur Factor", start=0, end=10, value=0)

    slider.on_change('value', update)

    doc.add_root(column(p, slider))

    doc.title = "Image Blur"


app = BokehASGI(modify_document)
