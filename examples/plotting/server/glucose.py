
import pandas as pd

from bokeh.sampledata.glucose import data
from bokeh.plotting import *


output_server("glucose.py example")

hold()

dates = data.index.astype('int64')/1000000 # Pandas keeps nanoseconds, need microseconds

line(dates, data['glucose'],
     x_axis_type = "datetime",
     color='red', tools="pan,zoom,resize", legend='glucose')
line(dates, data['isig'],
     color='blue', legend='isig')

curplot().title = "Glucose Measurements"

figure()

day = data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]

line(day.index.astype('int64')/1000000, day['glucose'],
     x_axis_type = "datetime",
     line_color="gray", line_dash="4 4", line_width=2,
     legend="glucose", tools="pan,zoom,resize")
scatter(highs.index.astype('int64')/1000000, highs['glucose'],
        color='tomato', radius=4, legend="high")
scatter(lows.index.astype('int64')/1000000, lows['glucose'],
        color='navy', radius=4, legend="low")

curplot().title = "Glucose Range"
xgrid()[0].grid_line_color=None
ygrid()[0].grid_line_dash="3 6"
ygrid()[0].grid_line_alpha=0.5

figure()

data['inrange'] = (data['glucose'] < 180) & (data['glucose'] > 80)
window = 30.5*288 #288 is average number of samples in a month
inrange = pd.rolling_sum(data.inrange, window)
inrange = inrange.dropna()
inrange = inrange/float(window)

line(inrange.index.astype('int64')/1000000, inrange,
     x_axis_type = "datetime",
     line_color="navy", legend="in-range", tools="pan,zoom,resize")

curplot().title = "Glucose In-Range Rolling Sum"

# open a browser
show()

