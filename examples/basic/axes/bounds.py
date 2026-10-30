from datetime import datetime, timedelta

import numpy as np

from bokeh.layouts import column, row
from bokeh.models import LinearAxis, Range1d
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import AAPL, GOOG

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

# Plot where bounds are set by auto
plot_default = figure(tools='pan, box_zoom, wheel_zoom, reset',
                      title="Cannot pan outside data (bounds='auto')",
                      lod_threshold=None)
plot_default.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
plot_default.x_range.bounds = 'auto'
plot_default.y_range.bounds = 'auto'

# Plot where ranges are manually set
x_range = Range1d(0, 3, bounds=(-1, 3.5), min_interval=1.5)
y_range = Range1d(0, 3, bounds=(-0.5, 4), min_interval=1.5)
plot_range = figure(tools='pan, box_zoom, wheel_zoom, reset',
                    x_range=x_range, y_range=y_range,
                    title="Manual bounds x:(-1, 3.5) y:(-0.5, 4) min_interval:1.5")
plot_range.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9)

# Manually set y_max only
x_range = Range1d(0, 3, max_interval=4)
y_range = Range1d(0, 3, bounds=(None, 3), max_interval=4)
plot_range_un = figure(tools='pan, wheel_zoom, reset',
                       x_range=x_range, y_range=y_range,
                       title="Unbounded (except for y_max=3 and max_interval=4)")
plot_range_un.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9, color='#043A8D')

# Bounded on reversed ranges (except for y_max)
x_range = Range1d(3, 0, bounds=(-1, 3.5), min_interval=1.5)
y_range = Range1d(3, 0, bounds=(-0.5, 4), min_interval=1.5)
plot_range_rev = figure(tools='pan,wheel_zoom,reset',
                        x_range=x_range, y_range=y_range,
                        title="Manual bounds x:(-1, 3.5) y:(-0.5, 4) min_range:1.5 (reverse ranges)")
plot_range_rev.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9, color='#8CBEDB')

# Chart where limits are set on a categorical range
fruits = {
    'fruit': [
        'apples', 'apples', 'apples', 'apples', 'apples',
        'pears', 'pears', 'pears', 'pears', 'pears',
        'bananas', 'bananas', 'bananas', 'bananas', 'bananas',
    ],
    'fruit_count': [
        4, 5, 8, 12, 4,
        6, 5, 4, 8, 7,
        1, 2, 4, 8, 12,
    ],
    'year': [
        '2009', '2010', '2011', '2012', '2013',
        '2009', '2010', '2011', '2012', '2013',
        '2009', '2010', '2011', '2012', '2013'],
}

# Plot with multiple ranges that are bounded
apple_x = [datetime.fromisoformat(date) for date in AAPL['date'][0:1000]]
google_x = [datetime.fromisoformat(date) for date in GOOG['date'][0:1000]]
apple_y = AAPL['adj_close'][0:1000]
google_y = GOOG['adj_close'][0:1000]

x_start = min(apple_x + google_x)
x_end = max(apple_x + google_x)
x_padding = (x_end - x_start) * 0.05
x_range = Range1d(
    start=x_start - x_padding, end=x_end + x_padding,
    bounds=(x_start - 2*x_padding, x_end + 2*x_padding),
    min_interval=timedelta(100),
)

def bounded_price_range(prices):
    low, high = min(prices), max(prices)
    padding = (high - low) * 0.1
    return Range1d(start=low - padding, end=high + padding,
                   bounds=(low - 2*padding, high + 2*padding))

y_range = bounded_price_range(apple_y)
y_range_extra = bounded_price_range(google_y)

plot_extra = figure(x_axis_type="datetime",
                    x_range=x_range, y_range=y_range,
                    title="Multiple bounded ranges: AAPL and GOOG adjusted close")
plot_extra.line(apple_x, apple_y, color='lightblue')
plot_extra.extra_y_ranges = {'goog': y_range_extra}
plot_extra.line(google_x, google_y, color='pink', y_range_name='goog')
plot_extra.add_layout(LinearAxis(y_range_name="goog", major_label_text_color='pink'), 'left')

# Tweak the formats to make it all readable
plots = [plot_default, plot_range, plot_range_un, plot_range_rev, plot_extra]

show(column(plot_default,
            row(plot_range, plot_range_un, plot_range_rev),
            plot_extra))
