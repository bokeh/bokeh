''' A `Box Plot`_ of autompg data. This example demonstrates combining
multiple basic glyphs to create a more complicated chart.

.. bokeh-example-metadata::
    :sampledata: autompg2
    :apis: bokeh.plotting.figure.vbar
    :refs: :ref:`ug_topics_stats_boxplot`
    :keywords: bars, boxplot, categorical, pandas

.. _Box Plot: https://en.wikipedia.org/wiki/Box_plot

'''
import pandas as pd

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg2 import autompg2
from bokeh.transform import factor_cmap

df = autompg2[["class", "hwy"]].rename(columns={"class": "kind"})

kinds = df.kind.unique()

# compute quantiles
qs = df.groupby("kind").hwy.quantile([0.25, 0.5, 0.75])
qs = qs.unstack().reset_index()
qs.columns = ["kind", "q1", "q2", "q3"]
df = pd.merge(df, qs, on="kind", how="left")

# compute IQR outlier bounds
iqr = df.q3 - df.q1
df["upper"] = df.q3 + 1.5*iqr
df["lower"] = df.q1 - 1.5*iqr

source = ColumnDataSource(df)

p = figure(x_range=kinds, tools="", toolbar_location=None,
           title="Highway MPG distribution by vehicle class",
           background_fill_color="#eaefef", y_axis_label="MPG")

# outlier range
whisker = p.whisker(dimension="height", base="kind", source=source)
whisker.glyph.upper_head.size = whisker.glyph.lower_head.size = 20

# quantile boxes
cmap = factor_cmap("kind", "TolRainbow7", kinds)
p.vbar("kind", 0.7, "q2", "q3", source=source, color=cmap, line_color="black")
p.vbar("kind", 0.7, "q1", "q2", source=source, color=cmap, line_color="black")

# outliers
outliers = df[~df.hwy.between(df.lower, df.upper)]
p.scatter("kind", "hwy", source=outliers, size=6, color="black", alpha=0.3)

p.xgrid.grid_line_color = None
p.axis.major_label_text_font_size="14px"
p.axis.axis_label_text_font_size="12px"

show(p)
