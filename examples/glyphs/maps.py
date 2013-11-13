import numpy as np
import pandas as pd
from scipy import misc
import os, sys
import itertools

from bokeh.objects import (
    GMapPlot, DataRange1d, Range1d, LinearAxis, Grid, ColumnDataSource,
    Glyph, ObjectArrayDataSource, PanTool, ZoomTool, ResizeTool,
    SelectionTool, BoxSelectionOverlay
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

select_tool = SelectionTool()
overlay = BoxSelectionOverlay(tool=select_tool)
plot.renderers.append(overlay)
plot.tools.append(select_tool)

xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)
pantool = PanTool(plot=plot)
zoomtool = ZoomTool(plot=plot)
plot.tools.extend([pantool, zoomtool])

# Plot some data on top
source = ObjectArrayDataSource(
        data = [{'lat': 30.2861, 'long': -97.7394, 'z': 20, 'fill': 'orange'},
                {'lat': 30.2855, 'long': -97.7390, 'z': 15, 'fill': 'blue'},
                {'lat': 30.2869, 'long': -97.7405, 'z': 15, 'fill': 'green'},
                ])
circle_renderer = Glyph(
        data_source = source,
        xdata_range = x_range,
        ydata_range = y_range,
        glyph = Circle(x="long", y="lat", fill_color="fill", radius=6,
                radius_units="screen", line_color="black")
        )
plot.data_sources.append(source)
plot.renderers.append(circle_renderer)

import requests
try:
    sess = session.PlotServerSession(
        username="defaultuser",
        serverloc="http://localhost:5006",
        userapikey="nokey"
    )
except requests.exceptions.ConnectionError as e:
    print e
    print "\nThis example requires the plot server.  Please make sure plot server is running, via 'bokeh-server' in the bokeh root directory.\n"
    sys.exit()

sess.use_doc("maps")
sess.add(plot, xgrid, ygrid, pantool, zoomtool, x_range, y_range,
        select_tool, overlay, source, circle_renderer)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
sess.store_all()

print "Stored to document maps at http://localhost:5006/bokeh"
