""" Example demonstrating turning lines on and off - with JS only

"""

import numpy as np

from bokeh.io import output_file, show
from bokeh.layouts import row
from bokeh.palettes import Viridis3
from bokeh.plotting import figure
from bokeh.models import CheckboxGroup, CustomJS

output_file("line_on_off.html", title="line_on_off.py example")

code = """
    if (checkbox.active.includes(0)) {
        l0.visible = true
    } else {
        l0.visible = false
    }
    if (checkbox.active.includes(1)) {
        l1.visible = true
    } else {
        l1.visible = false
    }
    if (checkbox.active.includes(2)) {
        l2.visible = true
    } else {
        l2.visible = false
    }
"""

p = figure()
props = dict(line_width=4, line_alpha=0.7)
x = np.linspace(0, 4 * np.pi, 100)
l0 = p.line(x, np.sin(x), color=Viridis3[0], legend="Line 0", **props)
l1 = p.line(x, 4 * np.cos(x), color=Viridis3[1], legend="Line 1", **props)
l2 = p.line(x, np.tan(x), color=Viridis3[2], legend="Line 2", **props)

callback = CustomJS(code=code, args={})
checkbox = CheckboxGroup(labels=["Line 0", "Line 1", "Line 2"], active=[0, 1, 2], callback=callback, width=100)
callback.args = dict(l0=l0, l1=l1, l2=l2, checkbox=checkbox)

layout = row(checkbox, p)
show(layout)
