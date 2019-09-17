import numpy as np

from bokeh.layouts import column, gridplot
from bokeh.models import BoxSelectTool, Div
from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

TOOLS = "wheel_zoom,save,box_select,lasso_select"

div = Div(text="""
<p>Selection behaviour in Bokeh can be configured in various ways. For instance,
the selection event can be set to happen on every mouse move, or only on mouseup.
Additionally the appearance of standard, selected, and non-selected glyphs is
fully customizable.</p>

<p>Make selections on the plots below to see these possibilities.</p>
""")

opts = dict(tools=TOOLS, plot_width=350, plot_height=350)

p1 = figure(title="selection on mouseup", **opts)
p1.circle(x, y, color="navy", size=6, alpha=0.6)

p2 = figure(title="selection on mousemove", **opts)
p2.square(x, y, color="olive", size=6, alpha=0.6)
p2.select_one(BoxSelectTool).select_every_mousemove = True

p3 = figure(title="default highlight", **opts)
p3.circle(x, y, color="firebrick", alpha=0.5, size=6)

p4 = figure(title="custom highlight", **opts)
p4.square(x, y, color="navy", size=6, alpha=0.6,
          nonselection_color="orange", nonselection_alpha=0.6)

output_file("scatter_selection.html", title="scatter_selection.py example")

layout = column(div,
                gridplot([[p1, p2], [p3, p4]], toolbar_location="right"),
                sizing_mode="scale_width")

show(layout)
