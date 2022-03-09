from bokeh.driving import count
from bokeh.palettes import RdYlGn
from bokeh.plotting import figure, curdoc, from_contour
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
    fill_data_dict, line_data_dict = contour_data_dicts(
        x, y, z, levels, fill_color=fill_color, line_color=line_color,
    )
    if fill_data_dict:
        contour_renderer.fill_renderer.data_source.data = fill_data_dict
    if line_data_dict:
        contour_renderer.line_renderer.data_source.data = line_data_dict

fig = figure()
contour_renderer = from_contour(x, y, z, levels, fill_color=fill_color, line_color=line_color)
fig.renderers.append(contour_renderer)
doc = curdoc()
doc.add_periodic_callback(callback, 100)
doc.add_root(fig)
