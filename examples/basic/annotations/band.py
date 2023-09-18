''' An interactive numerical band plot based on simple Python array of data.
    It is a combination of scatter plots and line plots added with a band of covered area.
    The line passes through the mean of the area covered by the band.

.. bokeh-example-metadata::
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.band, bokeh.plotting.figure, bokeh.io.show
    :refs: :ref:`ug_basic_annotations_bands`
    :keywords: figure, scatter, line, band, layout

'''
import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

# Create some random data
x = np.random.random(2500) * 140 +20
y = np.random.normal(size=2500) * 2 + 6 * np.log(x)

df = pd.DataFrame(data=dict(x=x, y=y)).sort_values(by="x")

df2 = df.y.rolling(window=300).agg({"y_mean": "mean", "y_std": "std"})

df = pd.concat([df, df2], axis=1)
df["lower"] = df.y_mean - df.y_std
df["upper"] = df.y_mean + df.y_std

source = ColumnDataSource(df.reset_index())

p = figure(tools="", toolbar_location=None, x_range=(40, 160))
p.title.text = "Rolling Standard Deviation"
p.xgrid.grid_line_color=None
p.ygrid.grid_line_alpha=0.5

p.scatter(x="x", y="y", color="blue", marker="dot", size=10, alpha=0.4, source=source)

p.line("x", "y_mean", line_dash=(10, 7), line_width=2, source=source)

p.band(
    dimension="height",
    base="x", lower="lower", upper="upper",
    fill_alpha=0.3, fill_color="yellow", line_color="black",
    source=source,
)

show(p)
