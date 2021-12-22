''' A 3D graph using the ColumnDataSource of Bokeh with the Graph3d library.
This example shows the custom extension feature of Bokeh.

'''
import numpy as np

from bokeh.driving import count
from bokeh.io import curdoc
from bokeh.models import ColumnDataSource

from .surface3d import Surface3d

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

curdoc().add_root(surface)

@count()
def update(t):
    source.data = compute(t)

curdoc().add_periodic_callback(update, 100)
curdoc().title = "Surface3d"
