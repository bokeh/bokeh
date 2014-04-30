from __future__ import print_function

import sys
import time
import requests

import numpy as np
import sympy as sy

from bokeh.objects import Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph, Grid, Legend
from bokeh.widgetobjects import Slider, HBox, VBox
from bokeh.glyphs import Patch, Line, Text
from bokeh.session import PlotServerSession

xs = sy.Symbol('x')
fx = sy.exp(-xs)*sy.sin(xs)

def taylor(fx, xs, order, x_range=(0, 1), n=200):
    x0, x1 = x_range
    x = np.linspace(float(x0), float(x1), n)

    fy = sy.lambdify(xs, fx, modules=['numpy'])(x)
    tx = fx.series(xs, n=order).removeO()

    if tx.is_Number:
        ty = np.zeros_like(x)
        ty.fill(float(tx))
    else:
        ty = sy.lambdify(xs, tx, modules=['numpy'])(x)

    return x, fy, ty

def update_data(order):
    plot.title = "%s vs. taylor(%s, n=%d)" % (fx, fx, order)
    x, fy, ty = taylor(fx, xs, order, (-2*sy.pi, 2*sy.pi), 200)
    source.data.update(dict(x=x, fy=fy, ty=ty))
    source._dirty = True
    slider.value = order
    slider._dirty = True

source = ColumnDataSource(data=dict(
    x  = [],
    fy = [],
    ty = [],
))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("fy")])

plot = Plot(data_sources=[source], x_range=xdr, y_range=ydr, width=800, height=400)

line_f = Line(x="x", y="fy", line_color="blue", line_width=2)
line_f_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_f)
plot.renderers.append(line_f_glyph)

line_t = Line(x="x", y="ty", line_color="red", line_width=2)
line_t_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_t)
plot.renderers.append(line_t_glyph)

xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)

xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
ygrid = Grid(plot=plot, dimension=1, axis=yaxis)

legend = Legend(plot=plot, orientation="bottom_left", legends={
    "%s"         % fx: [line_f_glyph],
    "taylor(%s)" % fx: [line_t_glyph],
})
plot.renderers.append(legend)

slider = Slider(start=1, end=20, value=1, step=1, title="Order:")
#slider.on_change('value', taylor, 'update_data')

inputs = HBox(children=[slider])
layout = VBox(children=[inputs, plot])

try:
    session = PlotServerSession(serverloc="http://localhost:5006")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

session.use_doc('taylor_server')
session.add_plot(layout)
session.store_all()

for order in range(1, 20):
    update_data(order)
    session.store_all()
    time.sleep(1)
