''' Add a custom key binding to a plot and list the plot's key bindings next to it.

.. bokeh-example-metadata::
    :title: Key bindings
    :keywords: key, binding, keyboard, shortcut
    :apis: bokeh.layouts.row, bokeh.models.CustomJS, bokeh.models.KeyBinding, bokeh.models.KeyboardShortcuts, bokeh.plotting.figure.circle
'''

import numpy as np

from bokeh.layouts import row
from bokeh.models import CustomJS, KeyBinding, KeyboardShortcuts
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
    keys="Ctrl+b",
    command="do_something",
    action=CustomJS(code="export default () => alert('doing something')"),
)
p.key_bindings.append(do_something)

# limit the height to the plot's, so that a long list of key bindings scrolls
shortcuts = KeyboardShortcuts(source=p, styles={"max-height": f"{p.height}px"})

show(row(p, shortcuts))
