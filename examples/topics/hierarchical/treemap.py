''' A treemap plot from the Sample Superstore dataset.

.. bokeh-example-metadata::
    :sampledata: sample_superstore
    :apis: bokeh.plotting.figure.block, bokeh.models.sources.ColumnDataSource
    :refs: :ref:`ug_topics_hierarchical_treemap`
    :keywords: hierarchical, block, treemap

'''
import pandas as pd
from squarify import normalize_sizes, squarify

from bokeh.plotting import figure, show
from bokeh.sampledata.sample_superstore import data
from bokeh.transform import factor_cmap

data = data[["City", "Region", "Sales"]]

regions = ("West", "Central", "South", "East")

sales_by_city = data.groupby(["Region", "City"]).sum("Sales")
sales_by_city = sales_by_city.sort_values(by="Sales").reset_index()

sales_by_region = sales_by_city.groupby("Region").sum("Sales").sort_values(by="Sales")

def treemap(df, col, x, y, dx, dy, *, N=100):
    sub_df = df.nlargest(N, col)
    normed = normalize_sizes(sub_df[col], dx, dy)
    blocks = squarify(normed, x, y, dx, dy)
    blocks_df = pd.DataFrame.from_dict(blocks).set_index(sub_df.index)
    return sub_df.join(blocks_df, how='left').reset_index()

x, y, w, h = 0, 0, 800, 450

blocks_by_region = treemap(sales_by_region, "Sales", x, y, w, h)

dfs = []
for index, (Region, Sales, x, y, dx, dy) in blocks_by_region.iterrows():
    df = sales_by_city[sales_by_city.Region==Region]
    dfs.append(treemap(df, "Sales", x, y, dx, dy, N=10))
blocks = pd.concat(dfs)

p = figure(width=w, height=h, tooltips="@City", toolbar_location=None,
           x_axis_location=None, y_axis_location=None)
p.x_range.range_padding = p.y_range.range_padding = 0
p.grid.grid_line_color = None

p.block('x', 'y', 'dx', 'dy', source=blocks, line_width=1, line_color="white",
        fill_alpha=0.8, fill_color=factor_cmap("Region", "MediumContrast4", regions))

p.text('x', 'y', x_offset=2, text="Region", source=blocks_by_region,
       text_font_size="18pt", text_color="white")

blocks["ytop"] = blocks.y + blocks.dy
p.text('x', 'ytop', x_offset=2, y_offset=2, text="City", source=blocks,
       text_font_size="6pt", text_baseline="top",
       text_color=factor_cmap("Region", ("black", "white", "black", "white"), regions))

show(p)
