''' A `Candlestick chart`_ based on stock price data. This example demonstrates
combining multiple glyphs. The non working days (weekends and bank holidays) are highlighted
with an `BoxAnnotation` in light gray.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.plotting.figure.segment, bokeh.plotting.figure.vbar, bokeh.models.BoxAnnotation
    :keywords: candlestick

.. _Candlestick chart: https://en.wikipedia.org/wiki/Candlestick_chart

'''
import pandas as pd

from bokeh.models import BoxAnnotation
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import MSFT

df = pd.DataFrame(MSFT)[60:120]
df["date"] = pd.to_datetime(df["date"])

inc = df.close > df.open
dec = df.open > df.close

non_working_days = df[['date']].assign(diff=df['date'].diff()-pd.Timedelta('1D'))
non_working_days = non_working_days[non_working_days['diff']>=pd.Timedelta('1D')]

df['date'] += pd.Timedelta('12h') # move candles to the center of the day

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(x_axis_type="datetime", tools=TOOLS, width=1000, height=400,
           title="MSFT Candlestick", background_fill_color="#efefef")
p.xaxis.major_label_orientation = 0.8 # radians

boxes = [
    BoxAnnotation(fill_color="#bbbbbb", fill_alpha=0.2, left=date-diff, right=date)
    for date, diff in non_working_days.values
]
p.renderers.extend(boxes)

p.segment(df.date, df.high, df.date, df.low, color="black")

p.vbar(df.date[dec], pd.Timedelta('16h'), df.open[dec], df.close[dec], color="#eb3c40")
p.vbar(df.date[inc], pd.Timedelta('16h'), df.open[inc], df.close[inc], fill_color="white",
       line_color="#49a3a3", line_width=2)

show(p)
