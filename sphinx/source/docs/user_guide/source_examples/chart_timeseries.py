import pandas as pd
from bokeh.charts import TimeSeries, output_file, show

AAPL = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date'])

output_file("timeseries.html")

data = dict(AAPL=AAPL['Adj Close'], Date=AAPL['Date'])

p = TimeSeries(data, index='Date', title="APPL", ylabel='Stock Prices')

show(p)

