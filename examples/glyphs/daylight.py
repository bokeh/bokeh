from __future__ import print_function

import numpy as np
import datetime as dt

from bokeh.objects import Plot, DataRange1d, DatetimeAxis, ColumnDataSource, Glyph, Grid, Legend
from bokeh.glyphs import Patch, Line, Text
from bokeh.session import HTMLFileSession
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

text_source = ColumnDataSource(dict(
    dates = [dt.date(2013, 2, 15), dt.date(2013, 7, 15), dt.date(2013, 12, 1)],
    times = [dt.time(11, 30)]*3,
    texts = ["CST (UTC+1)", "CEST (UTC+2)", "CST (UTC+1)"],
))

xdr = DataRange1d(sources=[source.columns("dates")])
ydr = DataRange1d(sources=[source.columns("sunrises", "sunsets")])

title = "Daylight Hours - Warsaw, Poland"
plot = Plot(title=title, data_sources=[source, patch1_source, patch2_source, text_source], x_range=xdr, y_range=ydr, width=800, height=400)

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

xaxis = DatetimeAxis(plot=plot, dimension=0)
yaxis = DatetimeAxis(plot=plot, dimension=1)
xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
ygrid = Grid(plot=plot, dimension=1, axis=yaxis)

legend = Legend(plot=plot, legends={"sunrise": [line1_glyph], "sunset": [line2_glyph]})
plot.renderers.append(legend)

session = HTMLFileSession("daylight.html")
session.add_plot(plot)

if __name__ == "__main__":
    session.save()
    print("Wrote %s" % session.filename)
    session.view()
