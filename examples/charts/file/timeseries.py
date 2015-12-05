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

output_file("timeseries.html")

# line simple
tsline = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True,
    title="Timeseries (Line)", tools=TOOLS, ylabel='Stock Prices')

# line explicit
tsline2 = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], color=['IBM', 'AAPL'],
    dash=['IBM', 'AAPL'], legend=True,
    title="Timeseries (Line Explicit)", tools=TOOLS, ylabel='Stock Prices')

# step
tsstep = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True, builder_type='step',
    title="Timeseries (Step)", tools=TOOLS, ylabel='Stock Prices')

# point
tspoint = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], marker=['IBM', 'AAPL'], legend=True,
    color=['IBM', 'AAPL'], builder_type='point',
    title="Timeseries (Point)", tools=TOOLS, ylabel='Stock Prices')

show(vplot(tsline, tsline2, tsstep, tspoint))
