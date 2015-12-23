from datetime import date
import numpy as np
from bokeh.charts import HeatMap
from bokeh.io import output_file, show, vplot
from bokeh.models import Range1d, LinearAxis
from bokeh.plotting import figure
from bokeh.sampledata.stocks import AAPL, GOOG

output_file('prevent_user_zooming_or_panning_too_far.html')

## Plot where limits are set automatically by DataRange1d
N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = ["#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50 + 2 * x, 30 + 2 * y)]
plot_datarange = figure(tools='pan, box_zoom, wheel_zoom, reset', title="Auto bounded (cannot pan outside data)")
plot_datarange.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

## Plot where limits are manually set
x_range = Range1d(0, 3, bounds=(-1, 3.5))
y_range = Range1d(0, 3, bounds=(-0.5, 4))
plot_range = figure(tools='pan, wheel_zoom, reset', x_range=x_range, y_range=y_range, title="Manual bounds")
plot_range.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9)

## Chart where limits are set on a categorical range (see compared to heatmap in charts)
fruits = {
    'fruit': [
        'apples', 'apples', 'apples', 'apples', 'apples',
        'pears', 'pears', 'pears', 'pears', 'pears',
        'bananas', 'bananas', 'bananas', 'bananas', 'bananas'
    ],
    'fruit_count': [
        4, 5, 8, 12, 4,
        6, 5, 4, 8, 7,
        1, 2, 4, 8, 12
    ],
    'year': [
        '2009', '2010', '2011', '2012', '2013',
        '2009', '2010', '2011', '2012', '2013',
        '2009', '2010', '2011', '2012', '2013']
}
plot_cat_unbounded = HeatMap(fruits, y='year', x='fruit', values='fruit_count', stat=None, title="Heatmap no bounds")
plot_cat_bounded = HeatMap(fruits, y='year', x='fruit', values='fruit_count', stat=None, title="Heatmap with bounds")
plot_cat_bounded.x_range.bounds = ['apples', 'pears']
plot_cat_bounded.y_range.bounds = ['2009', '2010', '2013']

## Plot with multiple ranges that are bounded
x = np.array(AAPL['date'], dtype=np.datetime64)
x = x[0:1000]
apple_y = AAPL['adj_close'][0:1000]
google_y = GOOG['adj_close'][0:1000]
x_range = Range1d(
    start=date(2000, 1, 1), end=date(2004, 12, 31),
    bounds=(date(2001, 1, 1), date(2006, 12, 31))
)
y_range = Range1d(start=00, end=40, bounds=(10, 60))
y_range_extra = Range1d(start=300, end=700, bounds=(200, 1000))

plot_extra = figure(x_axis_type="datetime", x_range=x_range, y_range=y_range)
plot_extra.line(x, apple_y, color='lightblue')
plot_extra.extra_y_ranges = {'goog': y_range_extra}
plot_extra.line(x, google_y, color='pink', y_range_name='goog')
plot_extra.add_layout(LinearAxis(y_range_name="goog", major_label_text_color='pink'), 'left')

show(vplot(plot_datarange, plot_range, plot_cat_unbounded, plot_cat_bounded, plot_extra))
