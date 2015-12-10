import pandas as pd

from bokeh.charts import TimeSeries, show, output_file
from bokeh.models.tools import HoverTool

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

xyvalues = dict(AAPL=AAPL['Adj Close'],
                Date=AAPL['Date'],
                MSFT=MSFT['Adj Close'],
                IBM=IBM['Adj Close'])

TOOLS = "resize,pan,wheel_zoom,box_zoom,reset,previewsave"

output_file("stocks_timeseries.html")

ts = TimeSeries(
    xyvalues, x='Date', y=['IBM', 'AAPL'], legend=True,
    title="Timeseries", tools=TOOLS, ylabel='Stock Prices')

# series is a generated column containing the labels of the data passed in as y
ts.add_tools(HoverTool(tooltips=[('stock', '@series'), ('value', '@y_values')]))

show(ts)
