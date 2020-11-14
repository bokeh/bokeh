""" Compare WebGL and SVG markers with canvas markers.

This covers all markers supported by scatter. The plots are put in tabs,
so that you can easily switch to compare positioning and appearance.

"""
import random

from bokeh.core.enums import MarkerType
from bokeh.layouts import row, column
from bokeh.models import ColumnDataSource, Panel, Tabs
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.iris import flowers

source = ColumnDataSource(flowers)
n = len(source.data["petal_length"])

gl_types = [
    "asterisk", "circle", "circle_cross", "circle_x", "cross", "diamond", "diamond_cross",
    "hex", "inverted_triangle", "square", "square_cross", "square_x", "triangle", "x",
]

u = lambda: int(random.uniform(0, 255))

markers = [ random.choice(gl_types) for i in range(0, n) ]
colors = [ "#%02x%02x%02x" % (u(), u(), u()) for i in range(0, n) ]

source.data["markers"] = markers
source.data["colors"] = colors

def fig():
    return figure(plot_width=500, plot_height=500, output_backend="webgl")

def scatter():
    p = fig()
    p.scatter("petal_length", "petal_width", source=source, color="colors", fill_alpha=0.2, size=12, marker="markers")
    return p

def plot(f):
    p = fig()
    getattr(p, f)("petal_length", "petal_width", source=source, color="colors", fill_alpha=0.2, size=12)
    return p

plots = [
    scatter(),
    plot("asterisk"),
    plot("circle"),
    plot("circle_cross"),
    #plot("circle_dot"),
    plot("circle_x"),
    #plot("circle_y"),
    plot("cross"),
    plot("diamond"),
    #plot("diamond_dot"),
    plot("diamond_cross"),
    #plot("dot"),
    plot("hex"),
    #plot("hex_dot"),
    plot("inverted_triangle"),
    #plot("plus"),
    plot("square"),
    plot("square_cross"),
    #plot("square_dot"),
    #plot("square_pin"),
    plot("square_x"),
    plot("triangle"),
    #plot("triangle_dot"),
    #plot("triangle_pin"),
    #plot("dash"),
    plot("x"),
    #plot("y"),
]

show(column(plots))
#show(p)

"""
def make_plot(title, marker, backend):
    p = figure(title=title, plot_width=350, plot_height=350, output_backend=backend)
    p.scatter("petal_length", "petal_width", source=source, color=colors, fill_alpha=0.2, size=12, marker=markers)
    return p

tabs = []
for marker in MarkerType:
    #p1 = make_plot(marker, marker, "canvas")
    #p2 = make_plot(marker + ' SVG', marker, "svg")
    p3 = make_plot(marker + ' GL', marker, "webgl")
    tabs.append(Panel(child=row(p3), title=marker))

output_file("marker_compare.html", title="Compare regular, SVG, and WebGL markers")

show(Tabs(tabs=tabs))
"""
