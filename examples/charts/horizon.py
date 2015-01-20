from collections import OrderedDict

import pandas as pd
import numpy as np
from bokeh.charts import Horizon

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

xyvalues = OrderedDict(
    AAPL=AAPL['Adj Close'],
    Date=AAPL['Date'],
    MSFT=MSFT['Adj Close'],
    IBM=IBM['Adj Close'],
)

h = Horizon(xyvalues, index='Date', title="horizon plot using stock inputs",
                width=1200, height=300, filename="stocks_horizon.html")

h.legend("top_right").show()


# x = np.linspace(0, np.pi*4, 137)
# y = (2*np.random.normal(size=137) + x**2)
# xx = np.hstack([-1*x[::-1], x])
# yy = np.hstack([-1*y[::-1], y])
# xyvalues = OrderedDict(x=xx, y=yy)

# h2 = Horizon(xyvalues, index='x', title="test horizon", ylabel='Random', filename="horizon.html")

# h2.legend("top_right").show()

