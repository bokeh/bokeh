# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from math import pi

import pandas as pd

from bokeh.sampledata.stocks import MSFT
from bokeh.plotting import *

df = pd.DataFrame(MSFT)[:50]
df["date"] = pd.to_datetime(df["date"])

mids = (df.open + df.close)/2
spans = abs(df.close-df.open)

inc = df.close > df.open
dec = df.open > df.close
w = 12*60*60*1000 # half day in ms

output_server("candlestick")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(x_axis_type="datetime", tools=TOOLS, plot_width=1000)

p.segment(df.date, df.high, df.date, df.low, color="black", toolbar_location="left")
p.rect(df.date[inc], mids[inc], w, spans[inc], fill_color="#D5E1DD", line_color="black")
p.rect(df.date[dec], mids[dec], w, spans[dec], fill_color="#F2583E", line_color="black")

p.title = "MSFT Candlestick"
p.xaxis.major_label_orientation = pi/4
p.grid.grid_line_alpha=0.3

show(p)  # open a browser
