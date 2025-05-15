import numpy as np

from bokeh.models import CustomJS, KeyBinding
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype=np.uint8)

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select,examine,fullscreen,help"

p = figure(tools=TOOLS)

p.circle(x, y, radius=radii,
         fill_color=colors, fill_alpha=0.6,
         line_color=None)

do_something = KeyBinding(
    description="Do something",
    key="Ctrl+b",
    command="do_something",
    action=CustomJS(code="export default () => alert('doing something')"),
)
p.key_bindings.append(do_something)

show(p)
