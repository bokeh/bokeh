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

data = pd.DataFrame(data=dict(AAPL=AAPL['Adj Close'],
                              MSFT=MSFT['Adj Close'],
                              IBM=IBM['Adj Close'],
                              Date=AAPL['Date'])).set_index('Date')

hp = Horizon(data, plot_width=800, plot_height=300,
             title="horizon plot using stock inputs", xlabel='Date')

output_file("horizon.html", title="horizon.py example")

show(hp)
