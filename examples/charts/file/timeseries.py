import pandas as pd

from bokeh.charts import TimeSeries, show, output_file, vplot

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

data = dict(
    AAPL=AAPL['Adj Close'],
    Date=AAPL['Date'],
    MSFT=MSFT['Adj Close'],
    IBM=IBM['Adj Close'],
)

TOOLS="resize,pan,wheel_zoom,box_zoom,reset,previewsave"

# line simple
tsline = TimeSeries(
    data, x='Date', y=['IBM', 'MSFT', 'AAPL'], legend=True,
    title="Timeseries (Line)", tools=TOOLS, ylabel='Stock Prices')

# line explicit
tsline2 = TimeSeries(
    data, x='Date', y=['IBM', 'MSFT', 'AAPL'], legend=True,
    color=['IBM', 'MSFT', 'AAPL'], dash=['IBM', 'MSFT', 'AAPL'],
    title="Timeseries (Line Explicit)", tools=TOOLS, ylabel='Stock Prices')

# step
tsstep = TimeSeries(
    data, x='Date', y=['IBM', 'MSFT', 'AAPL'], legend=True, builder_type='step',
    title="Timeseries (Step)", tools=TOOLS, ylabel='Stock Prices')

# point
tspoint = TimeSeries(
    data, x='Date', y=['IBM', 'MSFT', 'AAPL'], legend=True, builder_type='point',
    marker=['IBM', 'MSFT', 'AAPL'], color=['IBM', 'MSFT', 'AAPL'],
    title="Timeseries (Point)", tools=TOOLS, ylabel='Stock Prices')

output_file("timeseries.html", title="timeseries.py example")

show(vplot(tsline, tsline2, tsstep, tspoint))
