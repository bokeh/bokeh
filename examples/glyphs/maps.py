import numpy as np
import pandas as pd
from scipy import misc
import os, sys
import itertools

from bokeh.objects import (
    GMapPlot, DataRange1d, Range1d, LinearAxis, Grid, ColumnDataSource,
    GlyphRenderer, ObjectArrayDataSource, PanTool, ZoomTool, ResizeTool,
    SelectionTool, BoxSelectionOverlay
)
from bokeh.glyphs import MultiLine, ImageRGBA
from bokeh import session

x_range = Range1d()
y_range = Range1d()
plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    center_lat=30.2861, center_lng=-97.7394, zoom_level=15,
    data_sources=[],
    canvas_width=600, canvas_height=600,
    outer_width=600, outer_height=600,
    title = "GISR"
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

sess = session.PlotServerSession(
    username="defaultuser",
    serverloc="http://localhost:5006",
    userapikey="nokey"
)

sess.use_doc("maps")
sess.add(
    plot, xgrid, ygrid, pantool, zoomtool, x_range, y_range, select_tool, overlay
)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
sess.store_all()

print "Stored to document maps"
