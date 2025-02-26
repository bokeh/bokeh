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

from bokeh.models import ColumnDataSource, Whisker
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg2 import autompg2
from bokeh.transform import factor_cmap

df = autompg2[["class", "hwy"]].rename(columns={"class": "kind"})

kinds = df.kind.unique()

# compute quantiles
grouper = df.groupby("kind")
qs = grouper.hwy.quantile([0.25, 0.5, 0.75]).unstack().reset_index()
qs.columns = ["kind", "q1", "q2", "q3"]

# compute IQR outlier bounds
iqr = qs.q3 - qs.q1
qs["upper"] = qs.q3 + 1.5*iqr
qs["lower"] = qs.q1 - 1.5*iqr

# update the whiskers to actual data points
for kind, group in grouper:
    qs_idx = qs.query(f"kind=={kind!r}").index[0]
    data = group["hwy"]

    # the upper whisker is the maximum between p3 and upper
    q3 = qs.loc[qs_idx, "q3"]
    upper = qs.loc[qs_idx, "upper"]
    wiskhi = group[(q3 <= data) & (data <= upper)]["hwy"]
    qs.loc[qs_idx, "upper"] = q3 if len(wiskhi) == 0 else wiskhi.max()

    # the lower whisker is the minimum between q1 and lower
    q1 = qs.loc[qs_idx, "q1"]
    lower = qs.loc[qs_idx, "lower"]
    wisklo = group[(lower <= data) & (data<= q1)]["hwy"]
    qs.loc[qs_idx, "lower"] = q1 if len(wisklo) == 0 else wisklo.min()

df = pd.merge(df, qs, on="kind", how="left")

source = ColumnDataSource(qs)

p = figure(x_range=kinds, tools="", toolbar_location=None,
           title="Highway MPG distribution by vehicle class",
           background_fill_color="#eaefef", y_axis_label="MPG")

# outlier range
whisker = Whisker(base="kind", upper="upper", lower="lower", source=source)
whisker.upper_head.size = whisker.lower_head.size = 20
p.add_layout(whisker)

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
