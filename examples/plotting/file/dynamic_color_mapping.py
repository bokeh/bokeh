import numpy as np

from bokeh.layouts import gridplot
from bokeh.models import BasicTicker, BasicTickFormatter, ColorBar, LinearColorMapper
from bokeh.palettes import Plasma256
from bokeh.plotting import figure, show

tooltips = [("x", "$x"), ("y", "$y"), ("r", "@radius")]
tools = "pan,box_select,box_zoom,reset"

def data_flat(c=1.0):
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = c*np.linspace(0, 1, N)
    return x*100, y*100, r

def data_sloped():
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = 2*(x + y)*np.linspace(0, 1, N)
    return x*100, y*100, r

mapper = LinearColorMapper(palette=Plasma256, low_color="white", high_color="black")

p0 = figure(plot_width=500, plot_height=500, tooltips=tooltips, tools=tools)
x0, y0, r0 = data_flat(0.8)
g0 = p0.scatter(x0, y0, radius=r0, fill_color=dict(field="radius", transform=mapper), fill_alpha=0.6, line_color=None)
mapper.domain.append((g0, "radius"))

p1 = figure(plot_width=500, plot_height=500, tooltips=tooltips, tools=tools)
x1, y1, r1 = data_flat(1.0)
g1 = p1.scatter(x1, y1, radius=r1, fill_color=dict(field="radius", transform=mapper), fill_alpha=0.6, line_color=None)
mapper.domain.append((g1, "radius"))

p2 = figure(plot_width=500, plot_height=500, tooltips=tooltips, tools=tools)
x2, y2, r2 = data_flat(1.2)
g2 = p2.scatter(x2, y2, radius=r2, fill_color=dict(field="radius", transform=mapper), fill_alpha=0.6, line_color=None)
mapper.domain.append((g2, "radius"))

p3 = figure(plot_width=500, plot_height=500, tooltips=tooltips, tools=tools)
x3, y3, r3 = data_sloped()
g3 = p3.scatter(x3, y3, radius=r3, fill_color=dict(field="radius", transform=mapper), fill_alpha=0.6, line_color=None)
mapper.domain.append((g3, "radius"))

color_bar = ColorBar(color_mapper=mapper, location=(0, 0), orientation="horizontal",
    padding=0, ticker=BasicTicker(), formatter=BasicTickFormatter())
p3.add_layout(color_bar, "below")

grid = gridplot([[p0, p1], [p2, p3]])
show(grid)
