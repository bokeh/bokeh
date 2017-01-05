import pandas as pd

from bokeh.charts import TimeSeries, show, output_file
from bokeh.layouts import column

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

data = pd.DataFrame(data=dict(AAPL=AAPL['Adj Close'][:1000],
                              MSFT=MSFT['Adj Close'][:1000],
                              IBM=IBM['Adj Close'][:1000],
                              Date=AAPL['Date'][:1000])).set_index('Date')

TOOLS="pan,wheel_zoom,box_zoom,reset,save"
tooltips=[
        ("Open", "@Open"),
        ("Close", "@Close"),
        ("High", "@High"),
        ("Low", "@Low"),
        ("Volume", "@Volume")
    ]

# line simple
tsline = TimeSeries(
    data, y=['IBM', 'MSFT', 'AAPL'], legend=True,
    title="Timeseries (Line)", tools=TOOLS, ylabel='Stock Prices',
    xlabel='Date')

# line explicit
tsline2 = TimeSeries(
    data, y=['IBM', 'MSFT', 'AAPL'], legend=True,
    color=['IBM', 'MSFT', 'AAPL'], dash=['IBM', 'MSFT', 'AAPL'],
    title="Timeseries (Line Explicit)", tools=TOOLS, ylabel='Stock Prices',
    xlabel='Date')

# line w/ tooltips
tsline3 = TimeSeries(
    AAPL, y='Adj Close', x='Date', title="Timeseries (Tooltips)",
    tooltips=tooltips)

# step
tsstep = TimeSeries(
    data, y=['IBM', 'MSFT', 'AAPL'], legend=True, builder_type='step',
    title="Timeseries (Step)", tools=TOOLS, ylabel='Stock Prices',
    xlabel='Date')

# point
tspoint = TimeSeries(
    data, y=['IBM', 'MSFT', 'AAPL'], legend=True, builder_type='point',
    marker=['IBM', 'MSFT', 'AAPL'], color=['IBM', 'MSFT', 'AAPL'],
    title="Timeseries (Point)", tools=TOOLS, ylabel='Stock Prices',
    xlabel='Date')

output_file("timeseries.html", title="timeseries.py example")

show(column(tsline, tsline2, tsline3, tsstep, tspoint))
