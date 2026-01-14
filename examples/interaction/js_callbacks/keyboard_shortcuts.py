import numpy as np

from bokeh.io import curdoc
from bokeh.models import CustomJS, KeyBinding
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype=np.uint8)

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select,examine,fullscreen,help"

p = figure(tools=TOOLS)
p.key_bindings += [
    KeyBinding(description="Log a plot message", keys="Ctrl+/", action=CustomJS(code="console.log('A custom plot action')")),
]

p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

doc = curdoc()
doc.theme = "dark_minimal"
doc.config.key_bindings += [
    KeyBinding(description="Log a global message", keys="Ctrl+L", action=CustomJS(code="console.log('A custom global action')")),
]

show(p)
