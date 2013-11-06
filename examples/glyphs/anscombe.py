
import os

import numpy as np
import pandas as pd

from bokeh.objects import (
    ColumnDataSource, Glyph, Grid, GridPlot, LinearAxis, Plot, Range1d
)
from bokeh.glyphs import Circle, Line
from bokeh import session

raw_columns=[
[10.0,   8.04,   10.0,   9.14,   10.0,   7.46,   8.0,    6.58],
[8.0,    6.95,   8.0,    8.14,   8.0,    6.77,   8.0,    5.76],
[13.0,   7.58,   13.0,   8.74,   13.0,   12.74,  8.0,    7.71],
[9.0,    8.81,   9.0,    8.77,   9.0,    7.11,   8.0,    8.84],
[11.0,   8.33,   11.0,   9.26,   11.0,   7.81,   8.0,    8.47],
[14.0,   9.96,   14.0,   8.10,   14.0,   8.84,   8.0,    7.04],
[6.0,    7.24,   6.0,    6.13,   6.0,    6.08,   8.0,    5.25],
[4.0,    4.26,   4.0,    3.10,   4.0,    5.39,   19.0,   12.5],
[12.0,   10.84,  12.0,   9.13,   12.0,   8.15,   8.0,    5.56],
[7.0,    4.82,   7.0,    7.26,   7.0,    6.42,   8.0,    7.91],
[5.0,    5.68,   5.0,    4.74,   5.0,    5.73,   8.0,    6.89]]

quartet = pd.DataFrame(data=raw_columns, columns=
                       ['Ix','Iy','IIx','IIy','IIIx','IIIy','IVx','IVy'])


circles_source = ColumnDataSource(
    data = dict(
        xi   = quartet['Ix'],
        yi   = quartet['Iy'],
        xii  = quartet['IIx'],
        yii  = quartet['IIy'],
        xiii = quartet['IIIx'],
        yiii = quartet['IIIy'],
        xiv  = quartet['IVx'],
        yiv  = quartet['IVy'],
    )
   )

x = np.linspace(-0.5, 20.5, 10)
y = 3 + 0.5 * x
lines_source = ColumnDataSource(data=dict(x=x, y=y))

xdr = Range1d(start=-0.5, end=20.5)
ydr = Range1d(start=-0.5, end=20.5)

def make_plot(title, xname, yname):
    plot = Plot(
        x_range=xdr, y_range=ydr, data_sources=[lines_source, circles_source],
        title=title, width=400, height=400, border_fill='white', background_fill='#e9e0db')
    xaxis = LinearAxis(plot=plot, dimension=0, location="bottom", axis_line_color=None)
    yaxis = LinearAxis(plot=plot, dimension=1, location="left", axis_line_color=None)
    xgrid = Grid(plot=plot, dimension=0)
    ygrid = Grid(plot=plot, dimension=1)
    line_renderer = Glyph(
        data_source = lines_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = Line(x='x', y='y', line_color="#666699", line_width=2),
    )
    plot.renderers.append(line_renderer)
    circle_renderer = Glyph(
        data_source = circles_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = Circle(x=xname, y=yname, radius=6, fill_color="#cc6633",
                       line_color="#cc6633", fill_alpha=0.5),
)
    plot.renderers.append(circle_renderer)
    return plot, (line_renderer, circle_renderer, xaxis, yaxis, xgrid, ygrid)

#where will this comment show up
I,   objsI   = make_plot('I', 'xi', 'yi')
II,  objsII  = make_plot('II', 'xii', 'yii')
III, objsIII = make_plot('III', 'xiii', 'yiii')
IV,  objsIV  = make_plot('IV', 'xiv', 'yiv')

grid = GridPlot(children=[[I, II], [III, IV]], width="800px")

sess = session.HTMLFileSession("anscombe.html")
sess.add(lines_source, circles_source, xdr, ydr)
sess.add(*(objsI + objsII + objsIII + objsIV))
sess.add(grid, I, II, III, IV)
sess.plotcontext.children.append(grid)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))

if __name__ == "__main__":
    try:
        import webbrowser
        webbrowser.open("file://" + os.path.abspath("anscombe.html"))
    except:
        pass
