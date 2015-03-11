# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import pandas as pd

from bokeh.sampledata.glucose import data
from bokeh.plotting import *

output_server("glucose")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p1 = figure(x_axis_type="datetime", tools=TOOLS)

p1.line(data.index, data['glucose'], color='red', legend='glucose')
p1.line(data.index, data['isig'], color='blue', legend='isig')

p1.title = "Glucose Measurements"
p1.xaxis.axis_label = 'Date'
p1.yaxis.axis_label = 'Value'

day = data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]

p2 = figure(x_axis_type="datetime", tools=TOOLS)

p2.line(day.index.to_series(), day['glucose'],
    line_color="gray", line_dash="4 4", line_width=1, legend="glucose")
p2.circle(highs.index, highs['glucose'], size=6, color='tomato', legend="high")
p2.circle(lows.index, lows['glucose'], size=6, color='navy', legend="low")

p2.title = "Glucose Range"
p2.xgrid[0].grid_line_color=None
p2.ygrid[0].grid_line_alpha=0.5
p2.xaxis.axis_label = 'Time'
p2.yaxis.axis_label = 'Value'

data['inrange'] = (data['glucose'] < 180) & (data['glucose'] > 80)
window = 30.5*288 #288 is average number of samples in a month
inrange = pd.rolling_sum(data.inrange, window)
inrange = inrange.dropna()
inrange = inrange/float(window)

p3 = figure(x_axis_type="datetime", tools=TOOLS)

p3.line(inrange.index, inrange, line_color="navy")

p3.title = "Glucose In-Range Rolling Sum"
p3.xaxis.axis_label = 'Date'
p3.yaxis.axis_label = 'Proportion In-Range'

show(vplot(p1,p2,p3))

