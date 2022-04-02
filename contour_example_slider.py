from bokeh.layouts import column
from bokeh.models import Slider
from bokeh.palettes import PiYG
from bokeh.plotting import figure, curdoc, from_contour
from bokeh.plotting.contour import contour_data
import numpy as np

def calc_z(timestep):
    return np.sin(x - 0.1*timestep)*np.cos(y - 0.02*timestep)

x, y = np.meshgrid(np.linspace(0, 10, 20), np.linspace(0, 6, 10))
z = calc_z(0)
nlevels = 12
levels = np.linspace(-1.0, 1.0, nlevels)
fill_color = PiYG[nlevels-1]
line_color = "blue"

def slider_callback(_attr, _old, new_value):
    z = calc_z(new_value)
    new_contour_data = contour_data(x, y, z, levels, fill_color=fill_color, line_color=line_color)
    contour_renderer.data = new_contour_data

fig = figure()
contour_renderer = from_contour(x, y, z, levels, fill_color=fill_color, line_color=line_color)
fig.renderers.append(contour_renderer)

slider = Slider(start=0, end=100, value=0, step=1, title="Time offset")
slider.on_change("value", slider_callback)

curdoc().add_root(column(fig, slider))
