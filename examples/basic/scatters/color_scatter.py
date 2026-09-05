''' A basic scatter. This example plot demonstrates manual colormapping and
many different plot tools.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.circle
    :refs: :ref:`ug_interaction_tools`, :ref:`ug_basic_scatters_markers`
    :keywords: scatter, tools

'''
import numpy as np

from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype=np.uint8)

TOOLS="crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select,examine,fullscreen,help"

p = figure(tools=TOOLS, width=400, height=400)
p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

from bokeh.models import Panel, Node
from bokeh.models.dom import ValueOf

hints = Panel(
    elements=[ValueOf(obj=p, attr="hints", formatter="raw", format="html")],
    position=Node(target="frame", symbol="bottom_left"),
    anchor="bottom_left",
    stylesheets=["""
    :host {
        background-color: white;
        border: 1px solid black;
    }
    """,
    ],
)
p.elements.append(hints)

show(p)
