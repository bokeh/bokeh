''' An adjacent bar plot of Pandas crosstab data.

.. bokeh-example-metadata::
    :sampledata: sample_superstore
    :apis: bokeh.plotting.figure.hbar, bokeh.models.sources.ColumnDataSource
    :refs: :ref:`ug_topics_hierarchical_crosstab`
    :keywords: hierarchical, crosstab

'''
import pandas as pd

from bokeh.core.properties import value
from bokeh.plotting import ColumnDataSource, figure, show
from bokeh.sampledata.sample_superstore import data as df
from bokeh.transform import cumsum, factor_cmap

rows = pd.crosstab(df.Category, df.Region, aggfunc='sum', values=df.Sales, normalize="index")

source = ColumnDataSource(rows.T)

cats = ["Office Supplies", "Furniture", "Technology"]
regions = source.data["Region"]

p = figure(y_range=cats, x_range=(-0.55, 1.02), height=400, width=700, tools="",
           x_axis_location=None, toolbar_location=None, outline_line_color=None)
p.grid.grid_line_color = None
p.yaxis.fixed_location = 0
p.axis.major_tick_line_color = None
p.axis.major_label_text_color = None
p.axis.axis_line_color = "#4a4a4a"
p.axis.axis_line_width = 6

source.data["color"] = [ "#dadada","#dadada", "#4a4a4a", "#dadada"]
for y in cats:
    left, right = cumsum(y, include_zero=True), cumsum(y)

    p.hbar(y=value(y), left=left, right=right, source=source, height=0.9,
           color=factor_cmap("Region", "MediumContrast4", regions))

    pcts = source.data[y]
    source.data[f"{y} text"] = [f"{r}\n{x*100:0.1f}%" for r, x in zip(regions, pcts)]

    p.text(y=value(y), x=left, text=f"{y} text", source=source, x_offset=10,
           text_color="color", text_baseline="middle", text_font_size="15px")

totals = pd.crosstab(df.Category, df.Region, margins=True, aggfunc='sum',
                     values=df.Sales, normalize="columns").All

p.hbar(right=0, left=-totals, y=totals.index, height=0.9, color="#dadada")

text = [f"{name} ({totals.loc[name]*100:0.1f}%)" for name in cats]
p.text(y=cats, x=0, text=text, text_baseline="middle", text_align="right",
       x_offset=-12, text_color="#4a4a4a", text_font_size="20px",
       text_font_style="bold")

show(p)
