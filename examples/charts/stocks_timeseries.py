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

aapl = AAPL[['Date', 'Adj Close']]
xyvalues = OrderedDict(AAPL=AAPL[['Date', 'Adj Close']],
                       MSFT=MSFT[['Date', 'Adj Close']],
                       IBM=IBM[['Date', 'Adj Close']])
df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])


xyvalues = OrderedDict(
    AAPL=zip(AAPL[['Date', 'Adj Close']].values[:, 0], AAPL[['Date', 'Adj Close']].values[:, 1]),
    MSFT=zip(MSFT[['Date', 'Adj Close']].values[:, 0], MSFT[['Date', 'Adj Close']].values[:, 1]),
    IBM=zip(IBM[['Date', 'Adj Close']].values[:, 0], IBM[['Date', 'Adj Close']].values[:, 1])
)

xyvalues = OrderedDict(
    AAPL=AAPL['Adj Close'],
    Date=AAPL['Date'],
    MSFT=MSFT['Adj Close'],
    IBM=IBM['Adj Close'],
)
#df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

from bokeh.charts import TimeSeries
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

#ts = TimeSeries(xyvalues, index='Date', title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
index = xyvalues.pop('Date')
#ts = TimeSeries(xyvalues, index=index, title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#ts = TimeSeries(xyvalues.values(), index=index, title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#ts = TimeSeries(np.array(xyvalues.values()), index=index, title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#raises an error
#ts = TimeSeries([index]+xyvalues.values(), index="date", title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
ts = TimeSeries([index]+xyvalues.values(), title="timeseries, pd_input",
                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#ts = TimeSeries(np.array([index]+xyvalues.values()), title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)


# multiple indexes

#ind1 = index[0::2]
#ind2 = index[1::2]
#vs1 = [vs[0::2] for vs in xyvalues.values()]
#vs2 = [vs[1::2] for vs in xyvalues.values()]
#series1 = [ind1] + vs1
#series2 = [ind2] + vs2
#
#ts = TimeSeries((series1, series2), title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#pd1 = pd.DataFrame({"11": vs1[0], "12": vs1[1], })
#pd1.index = ind1
#pd2 = pd.DataFrame({"21": vs2[0], "22": vs2[1], })
#pd2.index = ind2
#big = pd1.join(pd2, how='outer')
#
#ts = TimeSeries(big, title="timeseries, pd_input",
#                ylabel='Stock Prices', filename="stocks_timeseries.html")#, facet=True)
#
#import pdb; pdb.set_trace()

ts.legend("top_left").show()
