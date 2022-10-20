''' A `Candlestick chart`_ based on stock price data. This example demonstrates
combining multiple glyphs.

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
w = 16*60*60*1000 # milliseconds

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(x_axis_type="datetime", tools=TOOLS, width=1000, height=400,
           title="MSFT Candlestick", background_fill_color="#efefef")
p.xaxis.major_label_orientation = 0.8 # radians

p.segment(df.date, df.high, df.date, df.low, color="black")

p.vbar(df.date[dec], w, df.open[dec], df.close[dec], color="#eb3c40")
p.vbar(df.date[inc], w, df.open[inc], df.close[inc], fill_color="white",
       line_color="#49a3a3", line_width=2)

show(p)
