
import os

import numpy as np
import pandas as pd

from bokeh.objects import (
    ColumnDataSource, GlyphRenderer, Grid, GridPlot, LinearAxis, Plot, Range1d
)
from bokeh.glyphs import Circle, Line
from bokeh import session

from StringIO import StringIO

# trailing asterisk is to preserve fixed width field whitespace at the end of the line
data = """
I       I       II      II      III     III     IV      IV        *
x       y       x       y       x       y       x       y         *

10.0    8.04    10.0    9.14    10.0    7.46    8.0     6.58      *
8.0     6.95    8.0     8.14    8.0     6.77    8.0     5.76      *
13.0    7.58    13.0    8.74    13.0    12.74   8.0     7.71      *
9.0     8.81    9.0     8.77    9.0     7.11    8.0     8.84      *
11.0    8.33    11.0    9.26    11.0    7.81    8.0     8.47      *
14.0    9.96    14.0    8.10    14.0    8.84    8.0     7.04      *
6.0     7.24    6.0     6.13    6.0     6.08    8.0     5.25      *
4.0     4.26    4.0     3.10    4.0     5.39    19.0    12.50     *
12.0    10.84   12.0    9.13    12.0    8.15    8.0     5.56      *
7.0     4.82    7.0     7.26    7.0     6.42    8.0     7.91      *
5.0     5.68    5.0     4.74    5.0     5.73    8.0     6.89      *
"""

quartet = pd.read_fwf(StringIO(data), widths=[8]*8, header=[1,2], tupleize_cols=False)

circles_source = ColumnDataSource(
    data = dict(
        xi   = quartet['I']['x'],
        yi   = quartet['I']['y'],
        xii  = quartet['II']['x'],
        yii  = quartet['II']['y'],
        xiii = quartet['III']['x'],
        yiii = quartet['III']['y'],
        xiv  = quartet['IV']['x'],
        yiv  = quartet['IV']['y'],
    )
)

x = np.linspace(-0.5,10.5, 10)
y = 3 + 0.5 * x
lines_source = ColumnDataSource(data=dict(x=x, y=y))

xdr = Range1d(start=-0.5, end=10.5)
ydr = Range1d(start=-0.5, end=10.5)

def make_plot(title, xname, yname):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[lines_source, circles_source],
        title=title, width=400, height=400, border_fill='white', background_fill='#e9e0db')
    xaxis = LinearAxis(plot=plot, dimension=0, location="bottom", axis_line_alpha=0)
    yaxis = LinearAxis(plot=plot, dimension=1, location="left", axis_line_alpha=0)
    xgrid = Grid(plot=plot, dimension=0)
    ygrid = Grid(plot=plot, dimension=1)
    line_renderer = GlyphRenderer(
        data_source = lines_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = Line(x='x', y='y', line_color="#666699", line_width=2),
    )
    plot.renderers.append(line_renderer)
    circle_renderer = GlyphRenderer(
        data_source = circles_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = Circle(x=xname, y=yname, radius=6, fill_color="#cc6633", line_color="#cc6633", fill_alpha=0.5),
    )
    plot.renderers.append(circle_renderer)
    return plot, (line_renderer, circle_renderer, xaxis, yaxis, xgrid, ygrid)

I,   objsI   = make_plot('I', 'xi', 'yi')
II,  objsII  = make_plot('II', 'xii', 'yii')
III, objsIII = make_plot('III', 'xiii', 'yiii')
IV,  objsIV  = make_plot('IV', 'xiv', 'yiv')

grid = GridPlot(children=[[I, II], [III, IV]])

sess = session.HTMLFileSession("anscombe.html")
sess.add(lines_source, circles_source, xdr, ydr)
sess.add(*(objsI + objsII + objsIII + objsIV))
sess.add(grid, I, II, III, IV)
sess.plotcontext.children.append(grid)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))

try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath("anscombe.html"))
except:
    pass
