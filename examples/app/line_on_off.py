""" Example demonstrating turning lines on and off - with bokeh server

"""

import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.palettes import Viridis3
from bokeh.plotting import figure
from bokeh.models import CheckboxGroup

p = figure()
props = dict(line_width=4, line_alpha=0.7)
x = np.linspace(0, 4 * np.pi, 100)
l0 = p.line(x, np.sin(x), color=Viridis3[0], legend="Line 0", **props)
l1 = p.line(x, 4 * np.cos(x), color=Viridis3[1], legend="Line 1", **props)
l2 = p.line(x, np.tan(x), color=Viridis3[2], legend="Line 2", **props)

checkbox = CheckboxGroup(labels=["Line 0", "Line 1", "Line 2"], active=[0, 1, 2], width=100)

def update(attr, old, new):
    l0.visible = 0 in checkbox.active
    l1.visible = 1 in checkbox.active
    l2.visible = 2 in checkbox.active

checkbox.on_change('active', update)

layout = row(checkbox, p)
curdoc().add_root(layout)
