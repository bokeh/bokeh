
import pandas as pd

from bokeh.sampledata.glucose import data
from bokeh.plotting import *

output_file("glucose.html", title="glucose.py example")

hold()

dates = data.index.to_series()

line(dates, data['glucose'],
     x_axis_type = "datetime",
     color='red', tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend='glucose')
line(dates, data['isig'],
     color='blue', legend='isig')

curplot().title = "Glucose Measurements"

figure()

data['inrange'] = (data['glucose'] < 180) & (data['glucose'] > 80)
window = 30.5*288 #288 is average number of samples in a month
inrange = pd.rolling_sum(data.inrange, window)
inrange = inrange.dropna()
inrange = inrange/float(window)

line(inrange.index.to_series(), inrange,
     x_axis_type = "datetime",
     line_color="navy", legend="in-range", tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     name="glucose2")

curplot().title = "Glucose In-Range Rolling Sum"

figure()

day = data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]

line(day.index.to_series(), day['glucose'],
     x_axis_type = "datetime",
     line_color="gray", line_dash="4 4", line_width=2,
     legend="glucose", tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     name="glucose")
scatter(highs.index.to_series(), highs['glucose'],
        color='tomato', legend="high")
scatter(lows.index.to_series(), lows['glucose'],
        color='navy', legend="low")

curplot().title = "Glucose Range"
xgrid().grid_line_color=None
ygrid().grid_line_dash="3 6"
ygrid().grid_line_alpha=0.5

show()  # open a browser

