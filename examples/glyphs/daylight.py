from __future__ import print_function

import numpy as np
import datetime as dt

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Patch, Line, Text
from bokeh.models import (
    ColumnDataSource, DataRange1d, DatetimeAxis,
    DatetimeTickFormatter, Grid, Legend, Plot
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
plot = Plot(
    title=title,
    x_range=xdr, y_range=ydr,
    plot_width=800, plot_height=400
)

patch1 = Patch(x="dates", y="times", fill_color="skyblue", fill_alpha=0.8)
plot.add_glyph(patch1_source, patch1)

patch2 = Patch(x="dates", y="times", fill_color="orange", fill_alpha=0.8)
plot.add_glyph(patch2_source, patch2)

line1 = Line(x="dates", y="sunrises", line_color="yellow", line_width=2)
line1_glyph = plot.add_glyph(source, line1)

line2 = Line(x="dates", y="sunsets", line_color="red", line_width=2)
line2_glyph = plot.add_glyph(source, line2)

text = Text(x="dates", y="times", text="texts", text_align="center")
plot.add_glyph(text_source, text)

xformatter = DatetimeTickFormatter(formats=dict(months=["%b %Y"]))
xaxis = DatetimeAxis(formatter=xformatter)
plot.add_layout(xaxis, 'below')

yaxis = DatetimeAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

legend = Legend(legends=[("sunrise", [line1_glyph]), ("sunset", [line2_glyph])])
plot.add_layout(legend)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "daylight.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Daylight Plot"))
    print("Wrote %s" % filename)
    view(filename)
