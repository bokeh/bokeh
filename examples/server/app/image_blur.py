''' An image blurring example. This sample shows the capability
of Bokeh to transform images to have certain effects.

.. note::
    This example needs the scipy package to run.

'''
import numpy as np
import scipy.datasets

try:
    from numba import njit
except ImportError:
    import warnings
    warnings.warn("numba is not installed. This example will be painfully slow.")
    njit = lambda f: f

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.palettes import gray
from bokeh.plotting import figure

image = scipy.datasets.ascent().astype(np.int32)[::-1, :]
w, h = image.shape

source = ColumnDataSource(data=dict(image=[image]))

p = figure(x_range=(0, w), y_range=(0, h))
p.image('image', x=0, y=0, dw=w, dh=h, palette=gray(256), source=source)

@njit
def blur(outimage, image, amt):
    for i in range(amt, w-amt):
        for j in range(amt, h-amt):
            px = 0.
            for iw in range(-amt//2, amt//2):
                for jh in range(-amt//2, amt//2):
                    px += image[i+iw, j+jh]
            outimage[i, j] = px/(amt*amt)

def update(attr, old, new):
    out = image.copy()
    blur(out, image, 2*new + 1)
    source.data.update(image=[out])

slider = Slider(title="Blur Factor", start=0, end=10, value=0)
slider.on_change('value', update)

curdoc().add_root(column(p, slider))
curdoc().title = "Image Blur"
