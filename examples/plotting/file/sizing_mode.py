import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.layouts import column
from bokeh.models import CustomJS
from bokeh.models.widgets import Select
from bokeh.core.enums import SizingMode

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = [
    "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
]

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select"

sizing_mode = "fixed"

select = Select(title="Sizing mode", value=sizing_mode, options=list(SizingMode))

plot = figure(tools=TOOLS)
plot.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

layout = column(select, plot, sizing_mode=sizing_mode)

select.js_on_change('value', CustomJS(args=dict(layout=layout, plot=plot), code="""
    var sizing_mode = this.value;
    layout.sizing_mode = sizing_mode;
    plot.sizing_mode = sizing_mode;
"""))

output_file("sizing_mode.html", title="sizing_mode.py example")
show(layout)
