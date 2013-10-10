
import pandas as pd

from bokeh.sampledata.stocks import MSFT
from bokeh.plotting import *


output_file("candlestick.html", title="candlestick.py example")

hold()

df = pd.DataFrame(MSFT)
df['date'] = pd.to_datetime(df['date'])

dates = df.date.astype(int)
mids = (df.open + df.close)/2
spans = abs(df.close-df.open)

inc = df.close > df.open
dec = df.open > df.close
w = (dates[1]-dates[0])*0.7

segment(dates, df.high, dates, df.low, color='#000000', tools="pan,zoom,resize", width=1000)
rect(dates[inc], mids[inc], 5, spans[inc], fill_color="#D5E1DD", line_color="#000000" )
rect(dates[dec], mids[dec], 5, spans[dec], fill_color="#F2583E", line_color="#000000" )

curplot().title = "MSFT Candlestick"
xgrid()[0].grid_line_dash=""
xgrid()[0].grid_line_alpha=0.3
ygrid()[0].grid_line_dash=""
ygrid()[0].grid_line_alpha=0.3

# open a browser
show()

