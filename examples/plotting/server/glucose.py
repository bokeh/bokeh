# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import pandas as pd

from bokeh.sampledata.glucose import data
from bokeh.plotting import *

output_server("glucose")

hold()

dates = data.index.to_series()

figure(x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

line(dates, data['glucose'], color='red', legend='glucose')
line(dates, data['isig'], color='blue', legend='isig')

curplot().title = "Glucose Measurements"

day = data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]

figure(x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

line(day.index.to_series(), day['glucose'],
    line_color="gray", line_dash="4 4", line_width=1, legend="glucose")
scatter(highs.index.to_series(), highs['glucose'], size=6, color='tomato', legend="high")
scatter(lows.index.to_series(), lows['glucose'], size=6, color='navy', legend="low")

curplot().title = "Glucose Range"
xgrid()[0].grid_line_color=None
ygrid()[0].grid_line_alpha=0.5

data['inrange'] = (data['glucose'] < 180) & (data['glucose'] > 80)
window = 30.5*288 #288 is average number of samples in a month
inrange = pd.rolling_sum(data.inrange, window)
inrange = inrange.dropna()
inrange = inrange/float(window)

figure(x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

line(inrange.index.to_series(), inrange, line_color="navy")

curplot().title = "Glucose In-Range Rolling Sum"

# open a browser
show()

