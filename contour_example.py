from bokeh.io import show
from bokeh.palettes import Cividis, RdYlGn
from bokeh.plotting import figure, from_contour
import numpy as np

x, y = np.meshgrid(np.linspace(0, 10, 20), np.linspace(0, 6, 10))
z = np.sin(x)*np.cos(y)
nlevels = 10
levels = np.linspace(-1.0, 1.0, nlevels)

fill_color = RdYlGn[nlevels-1]
line_color = Cividis[nlevels][::-1]
#line_color = "black"

contour_renderer = from_contour(x, y, z, levels, fill_color=fill_color, line_color=line_color)

fig = figure()
fig.renderers.append(contour_renderer)
show(fig)
