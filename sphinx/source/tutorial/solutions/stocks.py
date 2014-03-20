
import numpy as np
import pandas as pd

from bokeh.plotting import *

# Here is some code to read in some stock data from the Yahoo Finance API
AAPL = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000",
    parse_dates=['Date'])
GOOG = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=GOOG&a=0&b=1&c=2000",
    parse_dates=['Date'])
MSFT = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000",
    parse_dates=['Date'])
IBM = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000",
    parse_dates=['Date'])

output_file("stocks.html", title="stocks.py example")

# EXERCISE: turn on plot hold
hold()

# EXERCISE: finish this line plot, and add more for the other stocks. Each one should
# have a legend, and its own color.
line(
    AAPL['Date'],                                       # x coordinates
    AAPL['Adj Close'],                                  # y coordinates
    color='#A6CEE3',                                    # set a color for the line
    legend='AAPL',                                      # attach a legend label
    x_axis_type = "datetime",                           # NOTE: only needed on first
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"   # NOTE: only needed on first
)
line(GOOG['Date'], GOOG['Adj Close'], color='#B2DF8A', legend='GOOG')
line(IBM['Date'], IBM['Adj Close'], color='#33A02C', legend='IBM')
line(MSFT['Date'], MSFT['Adj Close'], color='#FB9A99', legend='MSFT')

# EXERCISE: style the plot, set a title, lighten the gridlines, etc.
curplot().title = "Stock Closing Prices"
grid().grid_line_alpha=0.3

# EXERCISE: start a new figure
figure()

# Here is some code to compute the 30-day moving average for AAPL
aapl = AAPL['Adj Close']
aapl_dates = AAPL['Date']

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

# EXERCISE: plot a scatter of circles for the individual AAPL prices with legend
# 'close'. Remember to set the x axis type and tools on the first renderer
scatter(aapl_dates, aapl, size=4, color='#A6CEE3', legend='close',
        x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

# EXERCISE: plot a line of the AAPL moving average data with the legeng 'avg'
line(aapl_dates, aapl_avg, color='red', legend='avg')

# EXERCISE: style the plot, set a title, lighten the gridlines, etc.
curplot().title = "AAPL One-Month Average"
grid().grid_line_alpha=0.3

show()  # open a browser

