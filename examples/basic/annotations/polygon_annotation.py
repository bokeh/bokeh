from datetime import datetime as dt

import pandas as pd

from bokeh.models import PolyAnnotation
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import GOOG

p = figure(height=200, x_axis_type="datetime",
           background_fill_color="#efefef", title="Google stock")

df = pd.DataFrame(GOOG)
df["date"] = pd.to_datetime(df["date"])

p.line(df["date"], df["close"], line_width=1.5, color="grey")

start_date = dt(2008, 11, 24)
start_y = df.loc[df["date"] == start_date]["close"].values[0]

end_date = dt(2010, 1, 4)
end_y = df.loc[df["date"] == end_date]["close"].values[0]

polygon = PolyAnnotation(
    fill_color="blue", fill_alpha=0.2,
    xs=[start_date, start_date, end_date, end_date],
    ys=[start_y - 100, start_y + 100, end_y + 100, end_y - 100],
)
p.add_layout(polygon)

show(p)
