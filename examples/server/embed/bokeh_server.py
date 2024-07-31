import numpy as np

from bokeh.io import curdoc
from bokeh.plotting import figure

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5

p = figure(tools="", toolbar_location=None)
p.circle(x, y, radius=radii, fill_alpha=0.6)

curdoc().add_root(p)
