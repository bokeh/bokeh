from math import pi
import pandas as pd

from bokeh.sampledata.stocks import MSFT
from bokeh.plotting import *

output_file("candlestick.html", title="candlestick.py example", js="absolute", css="absolute")

hold()

df = pd.DataFrame(MSFT)[:50]
df['date'] = pd.to_datetime(df['date'])

mids = (df.open + df.close)/2
spans = abs(df.close-df.open)

inc = df.close > df.open
dec = df.open > df.close
w = 12*60*60*1000 # half day in ms

segment(df.date, df.high, df.date, df.low,
        x_axis_type = "datetime",
        color='#000000', tools="pan,wheel_zoom,box_zoom,reset,previewsave", width=1000,
        name="candlestick")
rect(df.date[inc], mids[inc], w, spans[inc],
     fill_color="#D5E1DD", line_color="#000000" )
rect(df.date[dec], mids[dec], w, spans[dec],
     fill_color="#F2583E", line_color="#000000" )

curplot().title = "MSFT Candlestick"
xaxis().major_label_orientation = pi/4
grid().grid_line_alpha=0.3

show()  # open a browser
