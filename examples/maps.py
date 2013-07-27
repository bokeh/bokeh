import numpy as np
import pandas as pd
from scipy import misc
import os, sys
import itertools

from bokeh.objects import (
    GMapPlot, DataRange1d, Range1d, LinearAxis, Rule, ColumnDataSource,
    GlyphRenderer, ObjectArrayDataSource, PanTool, ZoomTool, ResizeTool
)
from bokeh.glyphs import MultiLine, ImageRGBA
from bokeh import session



plot = GMapPlot(
    center_lat=35.349, center_lng=-116.595, zoom_level=17,
    data_sources=[],
    canvas_width=600, canvas_height=600, outer_width=600, outer_height=600
)

#pantool = PanTool(dataranges=[xdr, ydr], dimensions=("width", "height"))
#zoomtool = ZoomTool(dataranges=[xdr, ydr], dimensions=("width", "height"))
#resizetool = ResizeTool(plot=plot)

#xaxis = LinearAxis(plot=plot, dimension=0)
#yaxis = LinearAxis(plot=plot, dimension=1)
xgrid = Rule(plot=plot, dimension=0)
ygrid = Rule(plot=plot, dimension=1)

#plot.renderers.append(tracks_glyph_renderer)
#plot.tools = [pantool, zoomtool, resizetool]


plot_name = "GISR"
sess = session.PlotServerSession(
    username="defaultuser",
    serverloc="http://localhost:5006",
    userapikey="nokey"
)
sess.use_doc("maps")
#sess.add(plot, tracks_glyph_renderer, tracks_source, xaxis, yaxis, xgrid, ygrid)
sess.add(plot, xgrid, ygrid)
sess.plotcontext.children.append(plot)
sess.plotcontext._dirty = True
sess.store_all()
print "Stored to document",plot_name
