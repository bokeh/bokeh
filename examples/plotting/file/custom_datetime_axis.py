import pandas as pd

from bokeh.io import show, output_file
from bokeh.plotting import figure
from bokeh.sampledata.stocks import MSFT

df = pd.DataFrame(MSFT)[:51]
inc = df.close > df.open
dec = df.open > df.close

p = figure(plot_width=1000, title="MSFT Candlestick with Custom X-Axis")

# map dataframe indices to date strings and use as label overrides
p.xaxis.major_label_overrides = {
    i: date.strftime('%b %d') for i, date in enumerate(pd.to_datetime(df["date"]))
}
p.xaxis.bounds = (0, df.index[-1])
p.x_range.range_padding = 0.05

p.segment(df.index, df.high, df.index, df.low, color="black")
p.vbar(df.index[inc], 0.5, df.open[inc], df.close[inc], fill_color="#D5E1DD", line_color="black")
p.vbar(df.index[dec], 0.5, df.open[dec], df.close[dec], fill_color="#F2583E", line_color="black")

output_file("custom_datetime_axis.html", title="custom_datetime_axis.py example")

show(p)
