# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

output_server('stocks')

hold()

figure(x_axis_type = "datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

line(np.array(AAPL['date'], 'M64'), AAPL['adj_close'], color='#A6CEE3', legend='AAPL')
line(np.array(FB['date'], 'M64'), FB['adj_close'], color='#1F78B4', legend='FB')
line(np.array(GOOG['date'], 'M64'), GOOG['adj_close'], color='#B2DF8A', legend='GOOG')
line(np.array(IBM['date'], 'M64'), IBM['adj_close'], color='#33A02C', legend='IBM')
line(np.array(MSFT['date'], 'M64'), MSFT['adj_close'], color='#FB9A99', legend='MSFT')

curplot().title = "Stock Closing Prices"
grid().grid_alpha=0.3

aapl = np.array(AAPL['adj_close'])
aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

xax, yax = axis()
xax.axis_label = 'Date'
yax.axis_label = 'Price'

figure(x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

scatter(aapl_dates, aapl, size=4, color='#A6CEE3', legend='close')
line(aapl_dates, aapl_avg, color='red', legend='avg')

curplot().title = "AAPL One-Month Average"
grid().grid_alpha=0.3

xax, yax = axis()
xax.axis_label = 'Date'
yax.axis_label = 'Price'

show()  # open a browser

