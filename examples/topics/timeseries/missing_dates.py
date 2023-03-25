''' A `Candlestick chart`_ based on stock price data. This example demonstrates
possible technique for handling missing dates.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.plotting.figure.segment, bokeh.plotting.figure.vbar
    :keywords: candlestick

.. _Candlestick chart: https://en.wikipedia.org/wiki/Candlestick_chart

'''
import pandas as pd

from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import MSFT

df = pd.DataFrame(MSFT)[60:120]
df["date"] = pd.to_datetime(df["date"])

inc = df.close > df.open
dec = df.open > df.close

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(tools=TOOLS, width=1000, height=400,
           title="MSFT Candlestick without missing dates",
           background_fill_color="#efefef")
p.xaxis.major_label_orientation = 0.8 # radians
p.x_range.range_padding = 0.05

# map dataframe indices to date strings and use as label overrides
p.xaxis.major_label_overrides = {
    i: date.strftime('%b %d') for i, date in zip(df.index, df["date"])
}

# one tick per week (5 weekdays)
p.xaxis.ticker = list(range(df.index[0], df.index[-1], 5))

p.segment(df.index, df.high, df.index, df.low, color="black")

p.vbar(df.index[dec], 0.6, df.open[dec], df.close[dec], color="#eb3c40")
p.vbar(df.index[inc], 0.6, df.open[inc], df.close[inc], fill_color="white",
       line_color="#49a3a3", line_width=2)

show(p)
