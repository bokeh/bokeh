###
### NOTE: This exercise requires a network connection
###

import numpy as np
import pandas as pd

from bokeh.plotting import figure, output_file, show, VBox

# Here is some code to read in some stock data from the Yahoo Finance API
AAPL = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])
MSFT = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])
IBM = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])

output_file("stocks.html", title="stocks.py example")

# create a figure
p1 = figure(title="Stocks",
            x_axis_label="Date",
            y_axis_label="Close price",
            x_axis_type="datetime")
p1.below[0].formatter.formats = dict(years=['%Y'],
                                     months=['%b %Y'],
                                     days=['%d %b %Y'])

# EXERCISE: finish this line plot, and add more for the other stocks. Each one should
# have a legend, and its own color.
p1.line(
    AAPL['Date'],                                       # x coordinates
    AAPL['Adj Close'],                                  # y coordinates
    color='#A6CEE3',                                    # set a color for the line
    legend='AAPL',                                      # attach a legend label
)
p1.line(IBM['Date'], IBM['Adj Close'], color='#33A02C', legend='IBM')
p1.line(MSFT['Date'], MSFT['Adj Close'], color='#FB9A99', legend='MSFT')

# EXERCISE: style the plot, set a title, lighten the gridlines, etc.
p1.title = "Stock Closing Prices"
p1.grid.grid_line_alpha=0.3

# EXERCISE: start a new figure
p2 = figure(title="AAPL average",
            x_axis_label="Date",
            y_axis_label="Close price",
            x_axis_type="datetime")
p2.below[0].formatter.formats = dict(years=['%Y'],
                                     months=['%b %Y'],
                                     days=['%d %b %Y'])

# Here is some code to compute the 30-day moving average for AAPL
aapl = AAPL['Adj Close']
aapl_dates = AAPL['Date']

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

# EXERCISE: plot a scatter of circles for the individual AAPL prices with legend
# 'close'. Remember to set the x axis type and tools on the first renderer
p2.scatter(aapl_dates, aapl, size=4, color='#A6CEE3', legend='close')

# EXERCISE: plot a line of the AAPL moving average data with the legeng 'avg'
p2.line(aapl_dates, aapl_avg, color='red', legend='avg')

# EXERCISE: style the plot, set a title, lighten the gridlines, etc.
p2.title = "AAPL One-Month Average"
p2.grid.grid_line_alpha=0.3

show(VBox(p1, p2))  # open a browser

