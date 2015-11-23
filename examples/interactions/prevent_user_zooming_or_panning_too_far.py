import numpy as np
import pandas as pd
from bokeh.io import output_file, show, vplot
from bokeh._legacy_charts import HeatMap
from bokeh.plotting import figure
from bokeh.models import Range1d

output_file('prevent_user_zooming_or_panning_too_far.html')

## Plot where limits are manually set
x_range = Range1d(0, 3, bound_lower=-1, bound_upper=3.5)
y_range = Range1d(0, 3, bound_lower=-0.5, bound_upper=4)
plot_range = figure(
    tools='pan, wheel_zoom, reset', x_range=x_range, y_range=y_range
)
plot_range.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9)

## Plot where limits are set automatically by DataRange1d
N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50 + 2 * x, 30 + 2 * y)]
plot_datarange = figure(tools='pan, box_zoom, wheel_zoom, reset')
plot_datarange.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

## Chart where limits are set on a categorical range (see compared to heatmap in charts)
data = pd.DataFrame(
    {'apples': [4, 5, 8, 12, 4], 'pears': [6, 5, 4, 8, 7], 'bananas': [1, 2, 4, 8, 12]},
    index=['2009', '2010', '2011', '2012', '2013']
)
plot_cat = HeatMap(data)
plot_cat.x_range.bound_lower = 'apples'
plot_cat.x_range.bound_upper = 'pears'
plot_cat.y_range.bound_lower = '2009'
plot_cat.y_range.bound_upper = '2013'

show(vplot(plot_range, plot_datarange, plot_cat))
