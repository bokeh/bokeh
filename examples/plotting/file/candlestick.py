from math import pi
import pandas as pd

from bokeh.sampledata.stocks import MSFT
from bokeh.plotting import *

df = pd.DataFrame(MSFT)[:50]
df['date'] = pd.to_datetime(df['date'])

mids = (df.open + df.close)/2
spans = abs(df.close-df.open)

inc = df.close > df.open
dec = df.open > df.close
w = 12*60*60*1000 # half day in ms

output_file("candlestick.html", title="candlestick.py example")

figure(x_axis_type = "datetime", tools="pan,wheel_zoom,box_zoom,reset,previewsave",
       width=1000, name="candlestick")

hold()

segment(df.date, df.high, df.date, df.low, color='black')
rect(df.date[inc], mids[inc], w, spans[inc], fill_color="#D5E1DD", line_color="black")
rect(df.date[dec], mids[dec], w, spans[dec], fill_color="#F2583E", line_color="black")

curplot().title = "MSFT Candlestick"
xaxis().major_label_orientation = pi/4
grid().grid_line_alpha=0.3

show()  # open a browser
