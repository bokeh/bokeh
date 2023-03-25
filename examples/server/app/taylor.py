''' A taylor series visualization graph. This example demonstrates
the ability of Bokeh for inputted expressions to reflect on a chart.

'''
import numpy as np
import sympy as sy

from bokeh.core.properties import value
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import (ColumnDataSource, Legend, LegendItem,
                          PreText, Slider, TextInput)
from bokeh.plotting import figure

xs = sy.Symbol('x')
expr = sy.exp(-xs)*sy.sin(xs)

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

source = ColumnDataSource(data=dict(x=[], fy=[], ty=[]))

p = figure(x_range=(-7,7), y_range=(-100, 200), width=800, height=400)
line_f = p.line(x="x", y="fy", line_color="navy", line_width=2, source=source)
line_t = p.line(x="x", y="ty", line_color="firebrick", line_width=2, source=source)

p.background_fill_color = "lightgrey"

legend = Legend(location="top_right")
legend.items = [
    LegendItem(label=value(f"{expr}"), renderers=[line_f]),
    LegendItem(label=value(f"taylor({expr})"), renderers=[line_t]),
]
p.add_layout(legend)

def update():
    try:
        expr = sy.sympify(text.value, dict(x=xs))
    except Exception as exception:
        errbox.text = str(exception)
    else:
        errbox.text = ""
    x, fy, ty = taylor(expr, xs, slider.value, (-2*sy.pi, 2*sy.pi), 200)

    p.title.text = f"Taylor (n={slider.value}) expansion comparison for: {expr}"
    legend.items[0].label = value(f"{expr}")
    legend.items[1].label = value(f"taylor({expr})")
    source.data = dict(x=x, fy=fy, ty=ty)

slider = Slider(start=1, end=20, value=1, step=1, title="Order")
slider.on_change('value', lambda attr, old, new: update())

text = TextInput(value=str(expr), title="Expression:")
text.on_change('value', lambda attr, old, new: update())

errbox = PreText()

update()

inputs = column(text, slider, errbox, width=400)

curdoc().add_root(column(inputs, p))
