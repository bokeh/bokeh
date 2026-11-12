''' A comparison of ``HoverTool.hide_delay`` settings on densely packed data.
Move the cursor quickly across both plots: with no delay the tooltip and the
hover glyph flicker while crossing small gaps between points, while with the
default delay they stay visible until the next point is hit.

.. bokeh-example-metadata::
    :apis: bokeh.models.HoverTool, bokeh.plotting.figure.circle
    :refs: :ref:`ug_interaction_tools_hover_tool`
    :keywords: hover, tooltip, scatter, tools

'''
import numpy as np

from bokeh.layouts import row
from bokeh.models import HoverTool
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype=np.uint8)

TOOLS = "pan,wheel_zoom,box_zoom,reset"
TOOLTIPS = [("index", "$index"), ("(x, y)", "(@x{0.00}, @y{0.00})")]

def make_plot(hide_delay: int | None) -> figure:
    hover = HoverTool(tooltips=TOOLTIPS)
    if hide_delay is not None:
        hover.hide_delay = hide_delay

    title = f"hide_delay={hover.hide_delay} ms" + (" (default)" if hide_delay is None else "")
    p = figure(title=title, tools=TOOLS, width=500, height=500)
    p.add_tools(hover)

    p.circle(x, y, radius=radii,
             fill_color=colors, fill_alpha=0.6, line_color=None,
             hover_fill_color="black", hover_fill_alpha=1.0)

    return p

show(row(make_plot(0), make_plot(None)))
