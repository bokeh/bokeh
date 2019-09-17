from __future__ import print_function

import numpy as np
import datetime as dt

from bokeh.core.properties import value
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Patch, Line, Text
from bokeh.models import ColumnDataSource, DatetimeAxis, DatetimeTickFormatter, FixedTicker, Legend, LegendItem, Plot
from bokeh.resources import INLINE
from bokeh.sampledata import daylight
from bokeh.util.browser import view

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

calendar_start = df.Date.iloc[0]
summer_start = df.Date.iloc[summer_start]
summer_end = df.Date.iloc[summer_end]
calendar_end = df.Date.iloc[-1]

d1 = calendar_start + (summer_start - calendar_start)/2
d2 = summer_start + (summer_end - summer_start)/2
d3 = summer_end + (calendar_end - summer_end)/2

text_source = ColumnDataSource(dict(
    dates = [d1, d2, d3],
    times = [dt.time(11, 30)]*3,
    texts = ["CST (UTC+1)", "CEST (UTC+2)", "CST (UTC+1)"],
))

plot = Plot(plot_width=800, plot_height=400)
plot.title.text = "Daylight Hours 2013 - Warsaw, Poland"
plot.toolbar_location = None
plot.x_range.range_padding = 0

patch1 = Patch(x="dates", y="times", fill_color="#282e54")
plot.add_glyph(patch1_source, patch1)

patch2 = Patch(x="dates", y="times", fill_color="#ffdd91")
plot.add_glyph(patch2_source, patch2)

sunrise_line = Line(x="dates", y="sunrises", line_color="orange", line_width=4)
sunrise_line_renderer = plot.add_glyph(source, sunrise_line)

sunset_line = Line(x="dates", y="sunsets", line_color="crimson", line_width=4)
sunset_line_renderer = plot.add_glyph(source, sunset_line)

text = Text(x="dates", y="times", text="texts", text_align="center", text_color="grey")
plot.add_glyph(text_source, text)

xformatter = DatetimeTickFormatter(months="%b %d %Y")
from time import mktime
min_time = dt.datetime.min.time()
xticker = FixedTicker(ticks=[
    mktime(dt.datetime.combine(summer_start, min_time).timetuple()) * 1000,
    mktime(dt.datetime.combine(summer_end, min_time).timetuple()) * 1000
])
xaxis = DatetimeAxis(formatter=xformatter, ticker=xticker)
plot.add_layout(xaxis, 'below')

yaxis = DatetimeAxis()
yaxis.formatter.hours = ['%H:%M']
plot.add_layout(yaxis, 'left')

legend = Legend(items=[
    LegendItem(label=value('sunset'), renderers=[sunset_line_renderer]),
    LegendItem(label=value('sunrise'), renderers=[sunrise_line_renderer]),
])
plot.add_layout(legend)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "daylight.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Daylight Plot"))
    print("Wrote %s" % filename)
    view(filename)
