from __future__ import print_function

import numpy as np
import sympy as sy

from bokeh.core.properties import value
from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.glyphs import Line
from bokeh.models import Plot, Range1d, LinearAxis, ColumnDataSource, Grid, Legend, LegendItem
from bokeh.models.widgets import Slider, TextInput, PreText
from bokeh.models.layouts import WidgetBox, Column

document = Document()
session = push_session(document)

xs = sy.Symbol('x')
expr = sy.exp(-xs)*sy.sin(xs)
order = 1

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

def update_data():
    x, fy, ty = taylor(expr, xs, order, (-2*sy.pi, 2*sy.pi), 200)

    plot.title.text = "%s vs. taylor(%s, n=%d)" % (expr, expr, order)
    legend.items[0].label = value("%s" % expr)
    legend.items[1].label = value("taylor(%s)" % expr)
    source.data = dict(x=x, fy=fy, ty=ty)
    slider.value = order

source = ColumnDataSource(data=dict(x=[], fy=[], ty=[]))

xdr = Range1d(-7, 7)
ydr = Range1d(-20, 200)

plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=400)

line_f = Line(x="x", y="fy", line_color="blue", line_width=2)
line_f_glyph = plot.add_glyph(source, line_f)
plot.add_layout(line_f_glyph)

line_t = Line(x="x", y="ty", line_color="red", line_width=2)
line_t_glyph = plot.add_glyph(source, line_t)
plot.add_layout(line_t_glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

xgrid = Grid(dimension=0, ticker=xaxis.ticker)
ygrid = Grid(dimension=1, ticker=yaxis.ticker)

legend = Legend(location="top_right")
legend.items = [
    LegendItem(label=value("%s" % expr), renderers=[line_f_glyph]),
    LegendItem(label=value("taylor(%s)" % expr), renderers=[line_t_glyph]),
]
plot.add_layout(legend)

def on_slider_value_change(attr, old, new):
    global order
    order = int(new)
    update_data()

def on_text_value_change(attr, old, new):
    global expr

    try:
        expr = sy.sympify(new, dict(x=xs))
    except Exception as exception:
        errbox.text = str(exception)
    else:
        errbox.text = ""
        update_data()

slider = Slider(start=1, end=20, value=order, step=1, title="Order",callback_policy='mouseup')
slider.on_change('value', on_slider_value_change)

text = TextInput(value=str(expr), title="Expression:")
text.on_change('value', on_text_value_change)

errbox = PreText()

inputs = WidgetBox(children=[slider, text, errbox], width=600)
layout = Column(children=[inputs, plot])
update_data()
document.add_root(layout)
session.show(layout)

if __name__ == "__main__":
    document.validate()
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
