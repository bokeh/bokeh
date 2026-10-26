"""Toggle a plotted line using a widget callback."""

import numpy as np

from bokeh.layouts import row
from bokeh.models import CheckboxGroup
from bokeh.palettes import Viridis3
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    p = figure()
    props = dict(line_width=4, line_alpha=0.7)
    x = np.linspace(0, 4 * np.pi, 100)
    l0 = p.line(x, np.sin(x), color=Viridis3[0], legend_label="Line 0", **props)
    l1 = p.line(x, 4 * np.cos(x), color=Viridis3[1], legend_label="Line 1", **props)
    l2 = p.line(x, np.tan(x), color=Viridis3[2], legend_label="Line 2", **props)
    checkbox = CheckboxGroup(labels=["Line 0", "Line 1", "Line 2"], active=[0, 1, 2], width=100)

    def update(attr, old, new):
        l0.visible = 0 in checkbox.active
        l1.visible = 1 in checkbox.active
        l2.visible = 2 in checkbox.active

    checkbox.on_change('active', update)
    layout = row(checkbox, p)
    doc.add_root(layout)


app = BokehASGI(modify_document)
