import numpy as np

from bokeh.io import curdoc
from bokeh.plotting import figure

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = [
    f"#{int(r):02x}{int(g):02x}{150:02x}" for r, g in zip(50+2*x, 30+2*y)
]

p = figure(tools="", toolbar_location=None)

p.circle(x, y, radius=radii,
         fill_color=colors, fill_alpha=0.6,
         line_color=None)

curdoc().add_root(p)
