import numpy as np

from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import Spinner
from bokeh.plotting import figure

x = np.random.rand(10)
y = np.random.rand(10)

p = figure(x_range=(0, 1), y_range=(0, 1))
points = p.scatter(x=x, y=y, size=4)

spinner = Spinner(title="Glyph size", low=1, high=40, step=0.5, value=4, width=80)
spinner.js_link('value', points.glyph, 'size')

show(row(column(spinner, width=100), p))
