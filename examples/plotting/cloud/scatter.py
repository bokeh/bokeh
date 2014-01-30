import numpy as np
from itertools import izip
from bokeh.plotting import *

N = 4000

x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (r, g, 150) for r, g in izip(np.floor(50+2*x), np.floor(30+2*y))]
import bokeh.plotting as plotting
plotting.output_cloud("scatter")

scatter(x,y, radius=radii, radius_units="data",
        fill_color=colors, fill_alpha=0.6,
        line_color=None, tools="pan,wheel_zoom,resize", name="color_scatter_example")

show()  # open a browser

