import numpy as np
from bokeh.io import show
from bokeh.plotting import figure

x = np.linspace(0, 6*np.pi, 100)
y = np.sin(x)

p = figure(plot_height=250, sizing_mode="stretch_width", x_range=(0, 6*np.pi), tools="", toolbar_location=None)
p.line(x, y)

ticks = np.linspace(0, 6*np.pi, 13)

labels = dict(zip(ticks[1:], ["π/2", "π", "3π/2", "2π", "5π/2", "3π", "7π/2", "4π", "9π/2", "5π",  "11π/2", "6π",]))
p.xaxis[0].ticker = ticks
p.xgrid[0].ticker = ticks[1::2]
p.xaxis.major_label_overrides = labels

p.ygrid.grid_line_color = None

p.xgrid.band_hatch_pattern = "/"
p.xgrid.band_hatch_alpha = 0.6
p.xgrid.band_hatch_color = "lightgrey"
p.xgrid.band_hatch_weight = 0.5
p.xgrid.band_hatch_scale = 10

show(p)
