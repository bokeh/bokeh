from collections import OrderedDict

import pandas as pd

from bokeh.charts import TimeSeries, show, output_file

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

# any of the following commented are valid Bar inputs
#xyvalues = pd.DataFrame(xyvalues)
#lindex = xyvalues.pop('Date')
#lxyvalues = list(xyvalues.values())
#lxyvalues = np.array(xyvalues.values())

TOOLS="resize,pan,wheel_zoom,box_zoom,reset,previewsave"

output_file("stocks_timeseries.html")

ts = TimeSeries(
    xyvalues, index='Date', legend=True,
    title="timeseries, pd_input", tools=TOOLS, ylabel='Stock Prices')

# usage with iterable index
#ts = TimeSeries(
#    lxyvalues, index=lindex,
#    title="timeseries, pd_input", ylabel='Stock Prices')

show(ts)

