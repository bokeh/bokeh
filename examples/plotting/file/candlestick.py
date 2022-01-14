''' A `Candlestick chart`_ based on stock price data. This example demonstrates
combining multiple glyphs.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.plotting.figure.segment, bokeh.plotting.figure.vbar
    :refs: :ref:`userguide_plotting` > :ref:`userguide_plotting_multiple_glyphs`
    :keywords: candlestick

.. _Candlestick chart: https://en.wikipedia.org/wiki/Candlestick_chart

'''
from math import pi

import pandas as pd

from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import MSFT

df = pd.DataFrame(MSFT)[:50]
df["date"] = pd.to_datetime(df["date"])

inc = df.close > df.open
dec = df.open > df.close
w = 12*60*60*1000 # half day in ms

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(x_axis_type="datetime", tools=TOOLS, width=1000, title = "MSFT Candlestick")
p.xaxis.major_label_orientation = pi/4
p.grid.grid_line_alpha=0.3

p.segment(df.date, df.high, df.date, df.low, color="black")
p.vbar(df.date[inc], w, df.open[inc], df.close[inc], fill_color="#D5E1DD", line_color="black")
p.vbar(df.date[dec], w, df.open[dec], df.close[dec], fill_color="#F2583E", line_color="black")

show(p)
