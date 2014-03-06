
from numpy import cumprod, linspace, random
import time

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *
from bokeh.objects import GridPlot

num_points = 300

now = time.time()
dt = 24*3600 # days
dates = linspace(now, now + num_points*dt, num_points)
acme = cumprod(random.lognormal(0.0, 0.04, size=num_points))
choam = cumprod(random.lognormal(0.0, 0.04, size=num_points))

output_file("correlation.html", title="correlation.py example")

figure(x_axis_type = "datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

hold()

line(dates, acme, color='#1F78B4', legend='ACME')
line(dates, choam, color='#FB9A99', legend='CHOAM')

curplot().title = "Stock Returns"
grid().grid_line_alpha=0.3

figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave")

scatter(acme, choam, color='#A6CEE3', legend='close')

curplot().title = "ACME / CHOAM Correlations"
grid().grid_line_alpha=0.3

show()  # open a browser

