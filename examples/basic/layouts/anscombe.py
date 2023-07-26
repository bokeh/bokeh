''' A reproduction of `Anscombe's Quartet`_ using the low-level |bokeh.models|
API that also includes HTML content in a ``Div``.

.. bokeh-example-metadata::
    :sampledata: anscombe
    :apis: bokeh.layouts.column, bokeh.layouts.gridplot, bokeh.models.Plot, bokeh.models.LinearAxis
    :refs: :ref:`ug_basic_layouts_gridplot`
    :keywords: column, gridplot

.. _Anscombe's Quartet: https://en.wikipedia.org/wiki/Anscombe%27s_quartet

'''
import numpy as np

from bokeh.io import show
from bokeh.layouts import column, gridplot
from bokeh.models import (ColumnDataSource, Div, Grid, Line,
                          LinearAxis, Plot, Range1d, Scatter)
from bokeh.sampledata.anscombe import data as df

circle_source = ColumnDataSource(data=df)

x = np.linspace(-0.5, 20.5, 10)
y = 3 + 0.5 * x
line_source = ColumnDataSource(data=dict(x=x, y=y))

rng = Range1d(start=-0.5, end=20.5)

def make_plot(title, xname, yname):
    plot = Plot(x_range=rng, y_range=rng, width=400, height=400,
                background_fill_color='#efefef')
    plot.title.text = title

    xaxis = LinearAxis(axis_line_color=None)
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis(axis_line_color=None)
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    line = Line(x='x', y='y', line_color="#666699", line_width=2)
    plot.add_glyph(line_source, line)

    circle = Scatter(x=xname, y=yname, size=12, line_color="#cc6633",
                     fill_color="#cc6633",  fill_alpha=0.5)
    plot.add_glyph(circle_source, circle)

    return plot

#where will this comment show up
I   = make_plot('I',   'Ix',   'Iy')
II  = make_plot('II',  'IIx',  'IIy')
III = make_plot('III', 'IIIx', 'IIIy')
IV  = make_plot('IV',  'IVx',  'IVy')

grid = gridplot([[I, II], [III, IV]], toolbar_location=None)

div = Div(text="""
<h1>Anscombe's Quartet</h1>
<p>Anscombe's Quartet is a collection of four small datasets that have nearly
identical simple descriptive statistics (mean, variance, correlation, and
linear regression lines), yet appear very different when graphed.
</p>
""")

show(column(div, grid, sizing_mode="scale_width"))
