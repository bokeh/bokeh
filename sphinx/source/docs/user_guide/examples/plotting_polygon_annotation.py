from datetime import datetime as dt

import pandas as pd

from bokeh.models import PolyAnnotation
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.stocks import GOOG

output_file("polyannotation.html", title="polannotation example")

p = figure(
    plot_width=800,
    plot_height=250,
    x_axis_type="datetime",
    title="Google stock",
)

df = pd.DataFrame(GOOG)
df["date"] = pd.to_datetime(df["date"])

p.line(df["date"], df["close"], line_width=2, color="red")

start_date = dt(2008, 11, 24)
start_float = start_date.timestamp() * 1000
start_data = df.loc[df["date"] == start_date]["close"].values[0]

end_date = dt(2010, 1, 4)
end_float = end_date.timestamp() * 1000
end_data = df.loc[df["date"] == end_date]["close"].values[0]

polygon = PolyAnnotation(
    fill_color="blue",
    fill_alpha=0.3,
    xs=[start_float, start_float, end_float, end_float],
    ys=[start_data - 100, start_data + 100, end_data + 100, end_data - 100],
)
p.add_layout(polygon)

show(p)
