''' Fill horizontal bands across the plot between pairs of y coordinates.

.. bokeh-example-metadata::
    :title: HStrip
    :keywords: hstrip, reference
    :apis: bokeh.models.ColumnDataSource, bokeh.models.Grid, bokeh.models.HStrip, bokeh.models.LinearAxis, bokeh.models.Plot, bokeh.models.Range1d
    :example-ref: bokeh.models.glyphs.hstrip
'''

import numpy as np

from bokeh.core.properties import field
from bokeh.io import curdoc, show
from bokeh.models import (
    ColumnDataSource,
    Grid,
    HStrip,
    LinearAxis,
    Range1d,
    XYPlot,
)

N = 9
y0 = np.linspace(-9, 9, N)
y1 = [y + 0.2*(i + 1) for i, y in enumerate(y0)]

source = ColumnDataSource(dict(y0=y0, y1=y1))

plot = XYPlot(
    x_range=Range1d(start=-10, end=10),
    title=None, width=300, height=300,
    min_border=0, toolbar_location=None,
)

glyph = HStrip(y0=field("y0"), y1=field("y1"), fill_color="#7fc97f")
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, "below")

yaxis = LinearAxis()
plot.add_layout(yaxis, "left")

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
