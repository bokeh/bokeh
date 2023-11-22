''' A scatter plot matrix (SPLOM) chart using the `Palmer penguin dataset`_.
This example demonstrates sharing ranged between plots to achieve linked
panning.

.. bokeh-example-metadata::
    :sampledata: penguins
    :apis: bokeh.models.Scatter, bokeh.models.ColumnDataSource, bokeh.models.LinearAxis, bokeh.models.Plot, bokeh.models.DataRange1d
    :refs: :ref:`ug_topics_stats_splom`
    :keywords: models, scatter, splom

.. _Palmer penguin dataset: https://github.com/allisonhorst/palmerpenguins

'''
from itertools import product

from bokeh.io import show
from bokeh.layouts import gridplot
from bokeh.models import (BasicTicker, ColumnDataSource, DataRange1d,
                          Grid, LassoSelectTool, LinearAxis, PanTool,
                          Plot, ResetTool, Scatter, WheelZoomTool)
from bokeh.sampledata.penguins import data
from bokeh.transform import factor_cmap

df = data.copy()
df["body_mass_kg"] = df["body_mass_g"] / 1000

SPECIES = sorted(df.species.unique())
ATTRS = ("bill_length_mm", "bill_depth_mm", "body_mass_kg")
N = len(ATTRS)

source = ColumnDataSource(data=df)

xdrs = [DataRange1d(bounds=None) for _ in range(N)]
ydrs = [DataRange1d(bounds=None) for _ in range(N)]

plots = []

for i, (y, x) in enumerate(product(ATTRS, reversed(ATTRS))):
    p = Plot(x_range=xdrs[i%N], y_range=ydrs[i//N],
             background_fill_color="#fafafa",
             border_fill_color="white", width=200, height=200, min_border=5)

    if i % N == 0:  # first column
        p.min_border_left = p.min_border + 4
        p.width += 40
        yaxis = LinearAxis(axis_label=y)
        yaxis.major_label_orientation = "vertical"
        p.add_layout(yaxis, "left")
        yticker = yaxis.ticker
    else:
        yticker = BasicTicker()
    p.add_layout(Grid(dimension=1, ticker=yticker))

    if i >= N*(N-1):  # last row
        p.min_border_bottom = p.min_border + 40
        p.height += 40
        xaxis = LinearAxis(axis_label=x)
        p.add_layout(xaxis, "below")
        xticker = xaxis.ticker
    else:
        xticker = BasicTicker()
    p.add_layout(Grid(dimension=0, ticker=xticker))

    scatter = Scatter(x=x, y=y, fill_alpha=0.6, size=5, line_color=None,
                      fill_color=factor_cmap('species', 'Category10_3', SPECIES))
    r = p.add_glyph(source, scatter)
    p.x_range.renderers.append(r)
    p.y_range.renderers.append(r)

    # suppress the diagonal
    if (i%N) + (i//N) == N-1:
        r.visible = False
        p.grid.grid_line_color = None

    p.add_tools(PanTool(), WheelZoomTool(), ResetTool(), LassoSelectTool())

    plots.append(p)

show(gridplot(plots, ncols=N))
