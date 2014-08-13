from __future__ import print_function

import time

import numpy as np
import sympy as sy

from bokeh.objects import Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph, Grid, Legend
from bokeh.widgetobjects import Slider, TextInput, HBox, VBox, Dialog
from bokeh.glyphs import Patch, Line, Text
from bokeh.document import Document
from bokeh.session import Session

from requests.exceptions import ConnectionError

document = Document()
session = Session()
session.use_doc('taylor_server')
session.load_document(document)

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

    plot.title = "%s vs. taylor(%s, n=%d)" % (expr, expr, order)
    legend.legends = {
        "%s"         % expr: [line_f_glyph],
        "taylor(%s)" % expr: [line_t_glyph],
    }
    source.data = dict(x=x, fy=fy, ty=ty)
    slider.value = order

    session.store_document(document)

source = ColumnDataSource(data=dict(
    x  = [],
    fy = [],
    ty = [],
))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("fy")])

plot = Plot(data_sources=[source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=400)

line_f = Line(x="x", y="fy", line_color="blue", line_width=2)
line_f_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_f)
plot.renderers.append(line_f_glyph)

line_t = Line(x="x", y="ty", line_color="red", line_width=2)
line_t_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line_t)
plot.renderers.append(line_t_glyph)

xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)

xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

legend = Legend(plot=plot, orientation="bottom_left")
plot.renderers.append(legend)

def on_slider_value_change(obj, attr, old, new):
    global order
    order = int(new)
    update_data()

def on_text_value_change(obj, attr, old, new):
    try:
        global expr
        expr = sy.sympify(new, dict(x=xs))
    except (sy.SympifyError, TypeError, ValueError) as exception:
        dialog.content = str(exception)
        dialog.visible = True
        session.store_objects(dialog)
    else:
        update_data()

dialog = Dialog(title="Invalid expression", buttons=["Close"])

slider = Slider(start=1, end=20, value=order, step=1, title="Order:")
slider.on_change('value', on_slider_value_change)

text = TextInput(value=str(expr), title="Expression:")
text.on_change('value', on_text_value_change)

inputs = HBox(children=[slider, text])
layout = VBox(children=[inputs, plot, dialog])

document.add(layout)
update_data()

if __name__ == "__main__":
    link = session.object_link(document._plotcontext)
    print("Please visit %s to see the plots" % link)

    try:
        while True:
            session.load_document(document)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print()
    except ConnectionError:
        print("Connection to bokeh-server was terminated")
