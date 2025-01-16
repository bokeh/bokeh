import numpy as np

from bokeh.models import CustomJS, DividerItem, Menu, MenuItem, ToolMenu
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

TOOLS="hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,examine,fullscreen,help"

p = figure(tools=TOOLS)

p.circle(x, y, radius=radii,
         fill_color=colors, fill_alpha=0.6,
         line_color=None)

p.context_menu = Menu(
    items=[
        MenuItem(label="Do something", action=CustomJS(code="alert('did something')")),
        DividerItem(),
        MenuItem(label="Tools", menu=ToolMenu(toolbar=p.toolbar)),
    ],
)

show(p)
