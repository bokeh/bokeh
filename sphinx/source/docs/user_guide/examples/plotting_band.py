from bokeh.plotting import figure, show, output_file
from bokeh.models import Band, ColumnDataSource
import pandas as pd
import numpy as np

output_file("band.html", title="band.py example")

# Create some random data
x = np.random.random(2500) * 140 - 20
y = np.random.normal(size=2500) * 2 + 5

df = pd.DataFrame(data=dict(x=x, y=y)).sort_values(by="x")

sem = lambda x: x.std() / np.sqrt(x.size)
df2 = df.y.rolling(window=100).agg({"y_mean": np.mean, "y_std": np.std, "y_sem": sem})
df2 = df2.fillna(method='bfill')

df = pd.concat([df, df2], axis=1)
df['lower'] = df.y_mean - df.y_std
df['upper'] = df.y_mean + df.y_std

source = ColumnDataSource(df.reset_index())

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"
p = figure(tools=TOOLS)

p.scatter(x='x', y='y', line_color=None, fill_alpha=0.3, size=5, source=source)

band = Band(base='x', lower='lower', upper='upper', source=source, level='underlay',
            fill_alpha=1.0, line_width=1, line_color='black')
p.add_layout(band)

p.title.text = "Rolling Standard Deviation"
p.xgrid[0].grid_line_color=None
p.ygrid[0].grid_line_alpha=0.5
p.xaxis.axis_label = 'X'
p.yaxis.axis_label = 'Y'

show(p)
