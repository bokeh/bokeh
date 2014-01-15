from __future__ import print_function

import os
import sys
import requests
import itertools

import numpy as np
import pandas as pd
from scipy import misc

from bokeh.objects import (
    GMapPlot, DataRange1d, Range1d, LinearAxis, Grid, ColumnDataSource,
    Glyph, PanTool, WheelZoomTool, ResizeTool,
    BoxSelectTool, BoxSelectionOverlay
)
from bokeh.glyphs import MultiLine, ImageRGBA, Circle
from bokeh import session

# The Google Maps plot
x_range = Range1d()
y_range = Range1d()
plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    center_lat=30.2861, center_lng=-97.7394, zoom_level=15,
    data_sources=[],
    canvas_width=600, canvas_height=600,
    outer_width=600, outer_height=600,
    title = "Austin"
    )

select_tool = BoxSelectTool()
overlay = BoxSelectionOverlay(tool=select_tool)
plot.renderers.append(overlay)
plot.tools.append(select_tool)

xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)
pantool = PanTool(plot=plot)
wheelzoomtool = WheelZoomTool(plot=plot)
plot.tools.extend([pantool, wheelzoomtool])

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

try:
    sess = session.PlotServerSession(
        serverloc="http://localhost:5006",
        username="defaultuser",
        userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

sess.use_doc("maps")
sess.add(plot, recursive=True)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
sess.store_all()

print("Stored to document maps at http://localhost:5006/bokeh")
