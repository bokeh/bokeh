''' A scatter plot matrix (SPLOM) chart using the `Palmer penguin dataset`_.
This example demonstrates sharing ranged between plots to achieve linked
panning.

.. bokeh-example-metadata::
    :sampledata: penguins
    :apis: bokeh.models.glyphs.Circle, bokeh.models.sources.ColumnDataSource, bokeh.models.plots.Plot, bokeh.models.axes.LinearAxis, bokeh.models.plots.Plot, bokeh.models.ranges.DataRange1d # noqa: E501
    :refs: :ref:`ug_interaction_linked_panning`
    :keywords: models, scatter, splom

.. _Palmer penguin dataset: https://github.com/allisonhorst/palmerpenguins

'''
from itertools import product

from bokeh.io import show
from bokeh.layouts import gridplot
from bokeh.models import (BasicTicker, Circle, ColumnDataSource, DataRange1d,
                          Grid, LinearAxis, PanTool, Plot, WheelZoomTool)
from bokeh.sampledata.penguins import data
from bokeh.transform import factor_cmap

# get the data all on roughly the same scale
data["body_mass_kg"] = data["body_mass_g"] / 1000
data["bill_length_cm"] = data["bill_length_mm"] / 10
data["bill_depth_cm"] = data["bill_depth_mm"] / 10
del data["body_mass_g"], data["bill_length_mm"], data["bill_depth_mm"]

SPECIES = sorted(data.species.unique())
ATTRS = ("bill_length_cm", "bill_depth_cm", "body_mass_kg")
N = len(ATTRS)

source = ColumnDataSource(data=data)

xdr = DataRange1d(bounds=None)
ydr = DataRange1d(bounds=None)

plots = []

for i, (y, x) in enumerate(product(ATTRS, reversed(ATTRS))):
    p = Plot(x_range=xdr, y_range=ydr, background_fill_color="#fafafa",
             border_fill_color="white", width=200, height=200, min_border=2)

    if i % N == 0:  # first column
        p.min_border_left = p.min_border + 40
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

    circle = Circle(x=x, y=y, fill_alpha=0.4, size=5, line_color=None,
                    fill_color=factor_cmap('species', 'Category10_3', SPECIES))
    r = p.add_glyph(source, circle)
    xdr.renderers.append(r)
    ydr.renderers.append(r)

    p.add_tools(PanTool(), WheelZoomTool())

    plots.append(p)

show(gridplot(plots, ncols=N))

