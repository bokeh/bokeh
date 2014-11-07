from collections import OrderedDict
import pandas as pd

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

xyvalues = OrderedDict(AAPL=AAPL[['Date', 'Adj Close']],
                       MSFT=MSFT[['Date', 'Adj Close']],
                       IBM=IBM[['Date', 'Adj Close']])
df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

from bokeh.charts import TimeSeries, DataObject
#df = DataObject(df, force_alias=False)
#df = DataObject(df.to_dict())
#df = DataObject(df.values(), force_alias=False)
#df = DataObject(np.array(df.values()), force_alias=False)

ts = TimeSeries(df, title="timeseries, pd_input", filename="stocks_timeseries.html")
ts.legend("top_left").show()
