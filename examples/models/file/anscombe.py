''' A reproduction of `Anscombe's Quartet`_ using the low-level |bokeh.models|
API that also includes HTML content in a ``Div``.

.. bokeh-example-metadata::
    :sampledata: anscombe
    :apis: bokeh.layouts.column, bokeh.layouts.gridplot, bokeh.models.plots.Plot, bokeh.models.axes.LinearAxis
    :refs: :ref:`userguide_layout` > :ref:`userguide_layout_gridplot`
    :keywords: gridplot

.. _Anscombe's Quartet: https://en.wikipedia.org/wiki/Anscombe%27s_quartet

'''
import numpy as np

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.layouts import column, gridplot
from bokeh.models import (Circle, ColumnDataSource, Div, Grid,
                          Line, LinearAxis, Plot, Range1d)
from bokeh.resources import INLINE
from bokeh.sampledata.anscombe import data as df
from bokeh.util.browser import view

circles_source = ColumnDataSource(data=df)

x = np.linspace(-0.5, 20.5, 10)
y = 3 + 0.5 * x
lines_source = ColumnDataSource(data=dict(x=x, y=y))

xr = Range1d(start=-0.5, end=20.5)
yr = Range1d(start=-0.5, end=20.5)

def make_plot(title, xname, yname):
    plot = Plot(x_range=xr, y_range=yr, width=400, height=400,
                background_fill_color='#efefef')
    plot.title.text = title

    xaxis = LinearAxis(axis_line_color=None)
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis(axis_line_color=None)
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    line = Line(x='x', y='y', line_color="#666699", line_width=2)
    plot.add_glyph(lines_source, line)

    circle = Circle(
        x=xname, y=yname, size=12,
        fill_color="#cc6633", line_color="#cc6633", fill_alpha=0.5
    )
    plot.add_glyph(circles_source, circle)

    return plot

#where will this comment show up
I   = make_plot('I',   'Ix',   'Iy')
II  = make_plot('II',  'IIx',  'IIy')
III = make_plot('III', 'IIIx', 'IIIy')
IV  = make_plot('IV',  'IVx',  'IVy')

grid = gridplot([[I, II], [III, IV]], toolbar_location=None)

div = Div(text="""
<h1>Anscombe's Quartet</h1>
<p>Anscombe's df is a collection of four small datasets that have nearly
identical simple descriptive statistics (mean, variance, correlation, and linear
regression lines), yet appear very different when graphed.
</p>
""")

doc = Document()
doc.add_root(column(div, grid, sizing_mode="scale_width"))

if __name__ == "__main__":
    doc.validate()
    filename = "anscombe.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Anscombe's df"))
    print(f"Wrote {filename}")
    view(filename)
