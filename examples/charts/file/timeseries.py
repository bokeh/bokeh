from collections import OrderedDict

import pandas as pd

from bokeh.charts import TimeSeries, show, output_file, defaults, vplot, hplot

# read in some stock data from the Yahoo Finance API
AAPL = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])
MSFT = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])
IBM = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date'])

xyvalues = OrderedDict(
    AAPL=AAPL['Adj Close'],
    Date=AAPL['Date'],
    MSFT=MSFT['Adj Close'],
    IBM=IBM['Adj Close'],
)

TOOLS="resize,pan,wheel_zoom,box_zoom,reset,previewsave"

output_file("stocks_timeseries.html")

# line simple
tsline = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True,
    title="Timeseries", tools=TOOLS, ylabel='Stock Prices (Line)')

# line explicit
tsline2 = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], color=['IBM', 'AAPL'],
    dash=['IBM', 'AAPL'], legend=True,
    title="Timeseries", tools=TOOLS, ylabel='Stock Prices (Line Explicit)')

# step
tsstep = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True, builder_type='step',
    title="Timeseries", tools=TOOLS, ylabel='Stock Prices (Step)')

# point
tspoint = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True, builder_type='point',
    title="Timeseries", tools=TOOLS, ylabel='Stock Prices (Point)')

show(vplot(tsline, tsline2, tsstep, tspoint))
