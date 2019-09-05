""" Example demonstrating how to apply a theme

"""

import numpy as np

from bokeh.io import curdoc
from bokeh.plotting import figure

p = figure(width=800)
props = dict(line_width=4, line_alpha=0.7)

x = np.arange(-np.pi, np.pi, np.pi / 16)
l0 = p.line(x, np.sin(x), color='yellow', legend='sin', **props)
l2 = p.line(x, np.cos(x), color='red', legend='cos', **props)

curdoc().add_root(p)
curdoc().theme = 'dark_minimal'
