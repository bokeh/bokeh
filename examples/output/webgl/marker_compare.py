""" Compare WebGL and SVG markers with canvas markers.

This covers all markers supported by scatter. The plots are put in tabs,
so that you can easily switch to compare positioning and appearance.

"""
import numpy as np

from bokeh.core.enums import MarkerType
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, TabPanel, Tabs
from bokeh.plotting import figure, show

N = 100

x = np.random.random(size=N)
y = np.random.random(size=N)

colors = np.random.randint(0, 255, size=(N, 3), dtype="uint8")

source = ColumnDataSource(data=dict(x=x, y=y, colors=colors))

def make_plot(title, marker, backend):
    p = figure(title=title, width=350, height=350, output_backend=backend)
    p.scatter("x", "y", marker=marker, color="colors", fill_alpha=0.2, size=12, source=source)
    return p

tabs = []
for marker in MarkerType:
    p1 = make_plot(marker, marker, "canvas")
    p2 = make_plot(marker + ' SVG', marker, "svg")
    p3 = make_plot(marker + ' GL', marker, "webgl")
    tabs.append(TabPanel(child=row(p1, p2, p3), title=marker))

show(Tabs(tabs=tabs))
