""" Compare WebGL and SVG markers with canvas markers.

This covers all markers supported by scatter. The plots are put in tabs,
so that you can easily switch to compare positioning and appearance.

"""
from bokeh.core.enums import MarkerType
from bokeh.layouts import row
from bokeh.plotting import show, output_file, figure
from bokeh.models import ColumnDataSource, Panel, Tabs
from bokeh.sampledata.iris import flowers

source = ColumnDataSource(flowers)

def make_plot(title, marker, backend):
    p = figure(title=title, plot_width=350, plot_height=350, output_backend=backend)
    p.scatter("petal_length", "petal_width", source=source,
              color='blue', fill_alpha=0.2, size=12, marker=marker)
    return p

tabs = []
for marker in MarkerType:
    p1 = make_plot(marker, marker, "canvas")
    p2 = make_plot(marker + ' SVG', marker, "svg")
    p3 = make_plot(marker + ' GL', marker, "webgl")
    tabs.append(Panel(child=row(p1, p2, p3), title=marker))

output_file("marker_compare.html", title="Compare regular, SVG, and WebGL markers")

show(Tabs(tabs=tabs))
