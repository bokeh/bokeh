from __future__ import print_function

import numpy as np
import datetime as dt

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Patch, Line, Text
from bokeh.objects import (
    ColumnDataSource, DataRange1d, DatetimeAxis, DatetimeTickFormatter,
    Glyph, Grid, Legend, Plot
)
from bokeh.resources import INLINE
from bokeh.sampledata import daylight

df = daylight.daylight_warsaw_2013

source = ColumnDataSource(dict(
    dates = df.Date,
    sunrises = df.Sunrise,
    sunsets = df.Sunset,
))

patch1_source = ColumnDataSource(dict(
    dates = np.concatenate((df.Date, df.Date[::-1])),
    times = np.concatenate((df.Sunrise, df.Sunset[::-1]))
))

summer = df[df.Summer == 1]

patch2_source = ColumnDataSource(dict(
    dates = np.concatenate((summer.Date, summer.Date[::-1])),
    times = np.concatenate((summer.Sunrise, summer.Sunset[::-1]))
))

summer_start = df.Summer.tolist().index(1)
summer_end = df.Summer.tolist().index(0, summer_start)

calendar_start = df.Date.irow(0)
summer_start = df.Date.irow(summer_start)
summer_end = df.Date.irow(summer_end)
calendar_end = df.Date.irow(-1)

d1 = calendar_start + (summer_start - calendar_start)/2
d2 = summer_start + (summer_end - summer_start)/2
d3 = summer_end + (calendar_end - summer_end)/2

text_source = ColumnDataSource(dict(
    dates = [d1, d2, d3],
    times = [dt.time(11, 30)]*3,
    texts = ["CST (UTC+1)", "CEST (UTC+2)", "CST (UTC+1)"],
))

xdr = DataRange1d(sources=[source.columns("dates")])
ydr = DataRange1d(sources=[source.columns("sunrises", "sunsets")])

title = "Daylight Hours - Warsaw, Poland"
plot = Plot(title=title, data_sources=[source, patch1_source, patch2_source, text_source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=400)

patch1 = Patch(x="dates", y="times", fill_color="skyblue", fill_alpha=0.8)
patch1_glyph = Glyph(data_source=patch1_source, xdata_range=xdr, ydata_range=ydr, glyph=patch1)
plot.renderers.append(patch1_glyph)

patch2 = Patch(x="dates", y="times", fill_color="orange", fill_alpha=0.8)
patch2_glyph = Glyph(data_source=patch2_source, xdata_range=xdr, ydata_range=ydr, glyph=patch2)
plot.renderers.append(patch2_glyph)

line1 = Line(x="dates", y="sunrises", line_color="yellow", line_width=2)
line1_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line1)
plot.renderers.append(line1_glyph)

line2 = Line(x="dates", y="sunsets", line_color="red", line_width=2)
line2_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line2)
plot.renderers.append(line2_glyph)

text = Text(x="dates", y="times", text="texts", angle=0, text_align="center")
text_glyph = Glyph(data_source=text_source, xdata_range=xdr, ydata_range=ydr, glyph=text)
plot.renderers.append(text_glyph)

xformatter = DatetimeTickFormatter(formats=dict(months=["%b %Y"]))
xaxis = DatetimeAxis(plot=plot, formatter=xformatter)
plot.below.append(xaxis)
yaxis = DatetimeAxis(plot=plot)
plot.left.append(yaxis)
xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

legend = Legend(plot=plot, legends={"sunrise": [line1_glyph], "sunset": [line2_glyph]})
plot.renderers.append(legend)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "daylight.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Daylight Plot"))
    print("Wrote %s" % filename)
    view(filename)
