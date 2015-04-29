from __future__ import print_function

import os
import json

import numpy as np

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    GMapPlot, Range1d, ColumnDataSource, LinearAxis,
    PanTool, WheelZoomTool, BoxSelectTool,
    BoxSelectionOverlay, GMapOptions,
    NumeralTickFormatter, PrintfTickFormatter)
from bokeh.resources import INLINE

x_range = Range1d()
y_range = Range1d()

map_options = GMapOptions(lat=35, lng=-100, zoom=4)

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    title = "Austin"
)
plot.map_options.map_type="hybrid"

city_data = json.load(open(os.path.expanduser('~/us_cities.json'), 'rt'))
city_data['size'] = list(np.random.uniform(2, 30, len(city_data['lat'])))
city_data['color'] = list(np.random.uniform(0.0, 1.0, len(city_data['lat'])))
source = ColumnDataSource(data=city_data)


# todo: scale circle size on number of inhabitants
circle = Circle(x="lon", y="lat", size='size', fill_color='color')
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
    filename = "maps_cities.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps All US cities Example"))
    print("Wrote %s" % filename)
    view(filename)
