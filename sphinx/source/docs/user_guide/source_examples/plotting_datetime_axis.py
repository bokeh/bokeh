import pandas as pd
from bokeh.plotting import figure, output_file, show

AAPL = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date']
    )

output_file("datetime.html")

# create a new plot with a datetime axis type
p = figure(width=800, height=250, x_axis_type="datetime")

p.line(AAPL['Date'], AAPL['Close'], color='navy', alpha=0.5)

show(p)
