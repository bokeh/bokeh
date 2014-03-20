from __future__ import print_function

import os
import sys
import requests
import itertools

import numpy as np
import pandas as pd

from bokeh.objects import (
    GMapPlot, DataRange1d, Range1d, LinearAxis, ColumnDataSource,
    Glyph, PanTool, WheelZoomTool, ResizeTool, BoxSelectTool,
    BoxSelectionOverlay, ObjectExplorerTool, MapOptions)
from bokeh.glyphs import MultiLine, ImageRGBA, Circle
from bokeh import session

# The Google Maps plot
x_range = Range1d()
y_range = Range1d()
map_options = MapOptions(lat=30.2861, lng=-97.7394, zoom=15)
plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    data_sources=[],
    canvas_width=600, canvas_height=600,
    outer_width=600, outer_height=600,
    title = "Austin")

select_tool = BoxSelectTool()
overlay = BoxSelectionOverlay(tool=select_tool)
plot.renderers.append(overlay)
plot.tools.append(select_tool)

pantool = PanTool(plot=plot)
wheelzoomtool = WheelZoomTool(plot=plot)
objectexplorer = ObjectExplorerTool()
plot.tools.extend([pantool, wheelzoomtool, objectexplorer])

# Plot some data on top
source = ColumnDataSource(
        data=dict(
            lat=[30.2861, 30.2855, 30.2869],
            lon=[-97.7394, -97.7390, -97.7405],
            fill=['orange', 'blue', 'green']
        )
)

circle_renderer = Glyph(
        data_source = source,
        xdata_range = x_range,
        ydata_range = y_range,
        glyph = Circle(x="lon", y="lat", fill_color="fill", size=15,
                radius_units="screen", line_color="black")
        )
plot.data_sources.append(source)
plot.renderers.append(circle_renderer)

sess = session.HTMLFileSession("maps.html")
sess.add_plot(plot)

if __name__ == "__main__":
    sess.save()
    print("Wrote %s" % sess.filename)
    sess.view()
