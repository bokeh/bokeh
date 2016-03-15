import numpy as np

from bokeh.driving import count
from bokeh.io import curdoc
from bokeh.models import ColumnDataSource, VBox

from surface3d import Surface3d

x = np.arange(0, 300, 10)
y = np.arange(0, 300, 10)
xx, yy = np.meshgrid(x, y)
xx = xx.ravel()
yy = yy.ravel()

def compute(t):
    value = np.sin(xx/50 + t/10) * np.cos(yy/50 + t/10) * 50 + 50
    return dict(x=xx, y=yy, z=value, color=value)

source = ColumnDataSource(data=compute(0))

surface = Surface3d(
    x="x", y="y", z="z", color="color", data_source=source, selector="#myplot"
)

curdoc().add_root(VBox(surface))

@count()
def update(t):
    source.data = compute(t)

curdoc().add_periodic_callback(update, 100)
