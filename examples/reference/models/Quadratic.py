''' Draw quadratic curves with one control point each.

.. bokeh-example-metadata::
    :title: Quadratic
    :keywords: quadratic, reference
    :apis: bokeh.models.ColumnDataSource, bokeh.models.Grid, bokeh.models.LinearAxis, bokeh.models.Plot, bokeh.models.Quadratic
    :example-ref: bokeh.models.glyphs.quadratic
'''

import numpy as np

from bokeh.io import curdoc, show
from bokeh.models import (
        ColumnDataSource,
        Grid,
        LinearAxis,
        Quadratic,
        XYPlot,
)

N = 9
x = np.linspace(-2, 2, N)
y = x**2

source = ColumnDataSource(dict(
        x=x,
        y=y,
        xp02=x+0.4,
        xp01=x+0.1,
        yp01=y+0.2,
    ),
)

plot = XYPlot(
    title=None, width=300, height=300,
    min_border=0, toolbar_location=None)

glyph = Quadratic(x0="x", y0="y", x1="xp02", y1="y", cx="xp01", cy="yp01", line_color="#4daf4a", line_width=3)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
