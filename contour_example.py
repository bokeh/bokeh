from bokeh.io import show
from bokeh.palettes import Cividis, RdYlGn
from bokeh.plotting import figure
import numpy as np

x, y = np.meshgrid(np.linspace(0, 10, 20), np.linspace(0, 6, 10))
z = np.sin(x)*np.cos(y)
nlevels = 10
levels = np.linspace(-1.0, 1.0, nlevels)

fig = figure()
fig.contour(x, y, z, levels,
    fill_color=RdYlGn[nlevels-1],
    line_color=Cividis[nlevels][::-1],
)
show(fig)
