import numpy as np

from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.stocks import AAPL

# prepare some data
aapl = np.array(AAPL["adj_close"])
aapl_dates = np.array(AAPL["date"], dtype=np.datetime64)

window_size = 30
window = np.ones(window_size) / float(window_size)
aapl_avg = np.convolve(aapl, window, "same")

# output to static HTML file
output_file("first_steps.html")

# create a new plot with a datetime axis type
p = figure(plot_width=800, plot_height=350, x_axis_type="datetime")

# add renderers
p.circle(aapl_dates, aapl, size=4, color="darkgrey", alpha=0.2, legend_label="close")
p.line(aapl_dates, aapl_avg, color="navy", legend_label="avg")

# customize by setting attributes
p.title.text = "AAPL One-Month Average"
p.legend.location = "top_left"
p.grid.grid_line_alpha = 0
p.xaxis.axis_label = "Date"
p.yaxis.axis_label = "Price"

# show the results
show(p)
