''' A simple line plot demonstrating hatched patterns for grid bands.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.Grid
    :refs: :ref:`ug_styling_plots_grid_bands`
    :keywords: hatching, grid band

'''
import numpy as np

from bokeh.plotting import figure, show

x = np.linspace(0, 6*np.pi, 100)
y = np.sin(x)

p = figure(height=250, sizing_mode="stretch_width",
           x_range=(0, 6*np.pi), tools="", toolbar_location=None)

p.line(x, y)

ticks = np.linspace(0, 6*np.pi, 13)
p.xaxis.ticker = ticks
p.xgrid.ticker = ticks[1::2]

labels = ["π/2", "π", "3π/2", "2π", "5π/2", "3π", "7π/2", "4π", "9π/2", "5π",  "11π/2", "6π"]
p.xaxis.major_label_overrides = dict(zip(ticks[1:], labels))

p.ygrid.grid_line_color = None

p.xgrid.band_hatch_pattern = "/"
p.xgrid.band_hatch_alpha = 0.6
p.xgrid.band_hatch_color = "lightgrey"
p.xgrid.band_hatch_weight = 0.5
p.xgrid.band_hatch_scale = 10

show(p)
