
from bokeh.sampledata import glucose
from bokeh.plotting import *

day = glucose.data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]


output_file("glucose.html", title="glucose.py example")

hold()

line(day.index.astype('int')/1000000, day['glucose'], color='grey', tools="pan,zoom,resize")
scatter(highs.index.astype('int')/1000000, highs['glucose'], color='red', radius=4, legend="high")
scatter(lows.index.astype('int')/1000000, lows['glucose'], color='blue', radius=4, legend="low")

#figure()

# open a browser
show()

