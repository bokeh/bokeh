
from numpy import cumprod, linspace, random
import time

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

output_cloud("correlation")

hold()

num_points = 300

now = time.time()
dt = 24*3600 # days
dates = linspace(now, now + num_points*dt, num_points)
acme = cumprod(random.lognormal(0.0, 0.04, size=num_points))
choam = cumprod(random.lognormal(0.0, 0.04, size=num_points))

line(dates, acme,
     x_axis_type = "datetime",
     color='#1F78B4', tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend='ACME')
line(dates, choam, color='#FB9A99', legend='CHOAM')

curplot().title = "Stock Returns"
grid().grid_line_alpha=0.3

figure()

scatter(
    acme, choam, color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave", legend='close'
)

curplot().title = "ACME / CHOAM Correlations"
grid().grid_line_alpha=0.3

# open a browser
show()

