from __future__ import print_function

from bokeh.objects import Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph, Grid, Legend
from bokeh.glyphs import Patch, Line, Text
from bokeh.session import HTMLFileSession

import numpy as np
import sympy as sy

def taylor(func, order, x_range=(0, 1), n=200):
    x = np.linspace(float(x_range[0]), float(x_range[1]), n)
    x0 = x_range[0]
    xs = sy.Symbol('x')

    fx = func(xs)
    fy = sy.lambdify(xs, fx, modules=['numpy'])(x)

    tx = fx.series(xs, x0, n=order).removeO()

    if tx.is_Number:
        ty = np.zeros_like(x)
        ty.fill(float(tx))
    else:
        ty = sy.lambdify(xs, tx, modules=['numpy'])(x)

    return x, fy, ty

source = ColumnDataSource(data=dict(
    x  = [],
    fy = [],
    ty = [],
))

def update_data():
    x, fy, ty = taylor(sy.sin, 10, (0, 2*sy.pi), 200)
    source.data.update(dict(x=x, fy=fy, ty=ty))

update_data()

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("fy", "ty")])

plot = Plot(title="taylor", data_sources=[source], x_range=xdr, y_range=ydr, width=800, height=400)

line_f = Line(x="x", y="fy", line_color="blue", line_width=2)
line_f_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_f)
plot.renderers.append(line_f_glyph)

line_t = Line(x="x", y="ty", line_color="red", line_width=1)
line_t_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_t)
plot.renderers.append(line_t_glyph)

xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)

xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
ygrid = Grid(plot=plot, dimension=1, axis=yaxis)

legend = Legend(plot=plot, orientation="bottom_left", legends={
    "f(x)":         [line_f_glyph],
    "taylor(f(x))": [line_t_glyph],
})
plot.renderers.append(legend)

session = HTMLFileSession("taylor_server.html")
session.add_plot(plot)

if __name__ == "__main__":
    session.save()
    print("Wrote %s" % session.filename)
    session.view()
