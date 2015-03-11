# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import time

from numpy import cumprod, linspace, random

from bokeh.plotting import *

num_points = 300

now = time.time()
dt = 24*3600 # days in seconds
dates = linspace(now, now + num_points*dt, num_points) * 1000 # times in ms
acme = cumprod(random.lognormal(0.0, 0.04, size=num_points))
choam = cumprod(random.lognormal(0.0, 0.04, size=num_points))

output_server("correlation")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

r = figure(x_axis_type = "datetime", tools=TOOLS)

r.line(dates, acme, color='#1F78B4', legend='ACME')
r.line(dates, choam, color='#FB9A99', legend='CHOAM')

r.title = "Stock Returns"
r.grid.grid_line_alpha=0.3

c = figure(tools=TOOLS)

c.circle(acme, choam, color='#A6CEE3', legend='close')

c.title = "ACME / CHOAM Correlations"
c.grid.grid_line_alpha=0.3

show(vplot(r, c))  # open a browser



