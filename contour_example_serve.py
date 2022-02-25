from bokeh.driving import count
from bokeh.palettes import RdYlGn
from bokeh.plotting import figure, curdoc
from bokeh.plotting.contour import contour_data_dicts
import numpy as np

def calc_z(timestep):
    return np.sin(x - 0.1*timestep)*np.cos(y - 0.02*timestep)

x, y = np.meshgrid(np.linspace(0, 10, 20), np.linspace(0, 6, 10))
z = calc_z(0)
nlevels = 10
levels = np.linspace(-1.0, 1.0, nlevels)
fill_color = RdYlGn[nlevels-1]
line_color = "black"

@count()
def callback(timestep):
    timestep += 1
    z = calc_z(timestep)
    data_dicts = contour_data_dicts(x, y, z, levels, fill_color=fill_color, line_color=line_color)
    fill_glyph.data_source.data = data_dicts["fill"]
    line_glyph.data_source.data = data_dicts["line"]

fig = figure()
fill_glyph, line_glyph = fig.contour(x, y, z, levels, fill_color=fill_color, line_color=line_color)
doc = curdoc()
doc.add_periodic_callback(callback, 100)
doc.add_root(fig)
