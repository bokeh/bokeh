from collections import OrderedDict

import pandas as pd
from bokeh.charts import TimeSeries

# Here is some code to read in some stock data from the Yahoo Finance API
AAPL = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000",
    parse_dates=['Date'])
MSFT = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000",
    parse_dates=['Date'])
IBM = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000",
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
ts = TimeSeries(xyvalues, index='Date', title="timeseries, pd_input", tools=TOOLS,
                ylabel='Stock Prices', filename="stocks_timeseries.html")

# usage with iterable index
#ts = TimeSeries(lxyvalues, index=lindex, title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")

ts.legend("top_left").show()
