from collections import OrderedDict

import pandas as pd

from bokeh.charts import Horizon, output_file, show

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

shift = 30

xyvalues = OrderedDict(
    AAPL=AAPL['Adj Close'] - shift,
    Date=AAPL['Date'],
    MSFT=MSFT['Adj Close'] - shift,
    IBM=IBM['Adj Close'] - shift,
)

output_file("horizon.html")

hp = Horizon(
    xyvalues, x='Date', y=['AAPL', 'MSFT', 'IBM'],
    title="horizon plot using stock inputs",
    width=800, height=300
)

show(hp)
