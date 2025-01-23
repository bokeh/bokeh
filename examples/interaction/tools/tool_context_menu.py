""" Example showing how to configure the context menu of a plot, including
a sub-menu for allowing access to plot's tools.

.. bokeh-example-metadata::
    :apis: bokeh.models.Menu, bokeh.models.MenuItem
    :keywords: menu, context menu, tools

"""
import numpy as np

from bokeh.layouts import column, row
from bokeh.models import CustomJS, Div, Menu, MenuItem, Switch, ToolMenu
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,examine,fullscreen,help"

plot = figure(tools=TOOLS)
plot.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

plot.context_menu = Menu(
    items=[
        MenuItem(label="Do something", action=CustomJS(code="alert('did something')")),
        None,
        MenuItem(label="Tools", menu=ToolMenu(toolbar=plot.toolbar)),
    ],
)

toolbar_visible = Switch(active=plot.toolbar.visible)
toolbar_visible.js_on_change("active", CustomJS(args=dict(plot=plot), code="""
export default ({plot}, {active}) => {
    plot.toolbar_location = active ? "right" : null
}
"""))

layout = column([
    row([
        Div(text="Toolbar visible:"),
        toolbar_visible,
        Div(text="(access tools by right clicking the plot regardless of toolbar visibility)"),
    ]),
    plot,
])
show(layout)
