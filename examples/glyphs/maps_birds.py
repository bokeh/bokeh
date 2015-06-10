from __future__ import print_function

import numpy as np

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle, Oval
from bokeh.models import (
    GMapPlot, Range1d, ColumnDataSource, LinearAxis,
    PanTool, WheelZoomTool, BoxSelectTool,
    BoxSelectionOverlay, GMapOptions,
    NumeralTickFormatter, PrintfTickFormatter)
from bokeh.resources import INLINE

x_range = Range1d()
y_range = Range1d()

map_options = GMapOptions(lat=30.2861, lng=-97.7394, zoom=8)

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    title = "Bird tracking in Texas"
)
plot.map_options.map_type="hybrid"

N = 100000
source = ColumnDataSource(
    data=dict(
        lat=np.random.uniform(29, 32, N),
        lon=np.random.uniform(-95, -100.0, N),
        color=np.random.uniform(0, 1.0, N),  # todo: access this in JS
    )
)

circle = Oval(x="lon", y="lat", fill_color='color', line_color="black")
plot.add_glyph(source, circle)

pan = PanTool()
wheel_zoom = WheelZoomTool()
box_select = BoxSelectTool()

plot.add_tools(pan, wheel_zoom, box_select)

xaxis = LinearAxis(axis_label="lat", major_tick_in=0, formatter=NumeralTickFormatter(format="0.000"))
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis(axis_label="lon", major_tick_in=0, formatter=PrintfTickFormatter(format="%.3f"))
plot.add_layout(yaxis, 'left')

overlay = BoxSelectionOverlay(tool=box_select)
plot.add_layout(overlay)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "maps_birds.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps + Birds Example"))
    print("Wrote %s" % filename)
    view(filename)
