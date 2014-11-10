from collections import OrderedDict
import pandas as pd
import numpy as np
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

#xyvalues = OrderedDict(AAPL=AAPL[['Date', 'Adj Close']],
#                       MSFT=MSFT[['Date', 'Adj Close']],
#                       IBM=IBM[['Date', 'Adj Close']])

xyvalues = OrderedDict(
    AAPL=zip(AAPL[['Date', 'Adj Close']].values[:, 0], AAPL[['Date', 'Adj Close']].values[:, 1]),
    MSFT=zip(MSFT[['Date', 'Adj Close']].values[:, 0], MSFT[['Date', 'Adj Close']].values[:, 1]),
    IBM=zip(IBM[['Date', 'Adj Close']].values[:, 0], IBM[['Date', 'Adj Close']].values[:, 1])
)
#df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

from bokeh.charts import TimeSeries, DataAdapter, NewTimeSeries
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
xyvalues = np.array(xyvalues.values())

ts = NewTimeSeries(xyvalues, title="timeseries, pd_input", filename="stocks_timeseries.html")
ts.legend("top_left").show()
