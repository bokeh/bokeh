from __future__ import print_function

import sys
import requests

import numpy as np

from bokeh.glyphs import *
from bokeh.objects import (
    Plot, Range1d, LinearAxis, Grid, Glyph, ColumnDataSource, PanTool, WheelZoomTool
)
from bokeh import session
from bokeh import document

document = document.Document()
session = session.Session()
session.use_doc('prim_server')
session.load_document(document)

x = np.arange(1,6)
y = np.arange(5, 0, -1)

source = ColumnDataSource(data=dict(x=x,y=y))

xdr = Range1d(start=0, end=10)
ydr = Range1d(start=0, end=10)


def make_plot(name, glyph):
    glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = glyph,
    )

    pantool = PanTool(dimensions=["width", "height"])
    wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

    plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], min_border=80)
    xaxis = LinearAxis(plot=plot)
    plot.below.append(xaxis)
    yaxis = LinearAxis(plot=plot)
    plot.left.append(yaxis)
    xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
    ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

    plot.renderers.append(glyph_renderer)
    plot.tools = [pantool, wheelzoomtool]
    document.add(plot)
    session.store_document(document)

make_plot('annular_wedge', AnnularWedge(x="x", y="y", inner_radius=0.2, outer_radius=0.5, start_angle=0.8, end_angle=3.8))
make_plot('annulus', Annulus(x="x", y="y", inner_radius=0.2, outer_radius=0.5))
make_plot('arc', Arc(x="x", y="y", radius=0.4, start_angle=0.8, end_angle=3.8))
make_plot('circle', Circle(x="x", y="y", radius=1))
make_plot('oval', Oval(x="x", y="y", width=0.5, height=0.8, angle=-0.6))
make_plot('ray', Ray(x="x", y="y", length=25, angle=0.6))
make_plot('rect', Rect(x="x", y="y", width=0.5, height=0.8, angle=-0.6))
make_plot('text', Text(x="x", y="y", text="foo", angle=0.6))
make_plot('wedge', Wedge(x="x", y="y", radius=0.5, start_angle=0.9, end_angle=3.2))

link = session.object_link(document._plotcontext)
print ("please visit %s to see plots" % link)



