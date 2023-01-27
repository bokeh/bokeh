import numpy as np

from bokeh.models import TapTool
from bokeh.plotting import figure, show

xx, yy = np.meshgrid(range(0,101,4), range(0,101,4))
x = xx.flatten()
y = yy.flatten()
N = len(x)
inds = [str(i) for i in np.arange(N)]
radii = np.random.random(size=N)*0.4 + 1.7
colors = [
    f"#{int(r):02x}{int(g):02x}{150:02x}" for r, g in zip(50+2*x, 30+2*y)
]

TOOLS="crosshair,pan,wheel_zoom,box_zoom,reset,tap,save"

p = figure(title="Tappy Scatter", tools=TOOLS)

cr = p.circle(x, y, radius=radii,
              fill_color=colors, fill_alpha=0.6, line_color=None)

tr = p.text(x, y, text=inds, alpha=0.5, text_font_size="7px",
            text_baseline="middle", text_align="center")

# in the browser console, you will see messages when circles are clicked
tool = p.select_one(TapTool).renderers = [cr]

show(p)  # open a browser
