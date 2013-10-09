
from bokeh.sampledata import glucose
from bokeh.plotting import *

day = glucose.data.ix['2010-10-06']
highs = day[day['glucose'] > 180]
lows = day[day['glucose'] < 80]


output_file("glucose.html", title="glucose.py example")

hold()

line(glucose.data.index.astype('int')/1000000, glucose.data['glucose'], color='red', tools="pan,zoom,resize", legend='glucose')
line(glucose.data.index.astype('int')/1000000, glucose.data['isig'], color='blue', legend='isig')
curplot().title = "Glucose Measurements"

figure()

line(day.index.astype('int')/1000000, day['glucose'], color='grey', line_dash=[8, 8], line_width=2, tools="pan,zoom,resize")
scatter(highs.index.astype('int')/1000000, highs['glucose'], color='tomato', radius=4, legend="high")
scatter(lows.index.astype('int')/1000000, lows['glucose'], color='navy', radius=4, legend="low")
xgrid()[0].grid_line_color=None
curplot().title = "Glucose Range"

# open a browser
show()

