# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import figure, show, output_server, vplot

output_server("stocks")

p1 = figure(x_axis_type = "datetime")

p1.line(np.array(AAPL['date'], 'M64'), AAPL['adj_close'], color='#A6CEE3', legend='AAPL')
p1.line(np.array(FB['date'], 'M64'), FB['adj_close'], color='#1F78B4', legend='FB')
p1.line(np.array(GOOG['date'], 'M64'), GOOG['adj_close'], color='#B2DF8A', legend='GOOG')
p1.line(np.array(IBM['date'], 'M64'), IBM['adj_close'], color='#33A02C', legend='IBM')
p1.line(np.array(MSFT['date'], 'M64'), MSFT['adj_close'], color='#FB9A99', legend='MSFT')

p1.title = "Stock Closing Prices"
p1.grid.grid_line_alpha=0.3
p1.xaxis.axis_label = 'Date'
p1.yaxis.axis_label = 'Price'

aapl = np.array(AAPL['adj_close'])
aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

p2 = figure(x_axis_type="datetime")

p2.circle(aapl_dates, aapl, size=4, color='darkgrey', alpha=0.2, legend='close')
p2.line(aapl_dates, aapl_avg, color='navy', legend='avg')

p2.title = "AAPL One-Month Average"
p2.grid.grid_line_alpha=0
p2.xaxis.axis_label = 'Date'
p2.yaxis.axis_label = 'Price'
p2.ygrid.band_fill_color="olive"
p2.ygrid.band_fill_alpha = 0.1

show(vplot(p1,p2))  # open a browser
