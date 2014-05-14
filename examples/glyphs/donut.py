from __future__ import print_function

import base64
from math import pi, sin, cos
import pandas as pd

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.browserlib import view

from bokeh.glyphs import Wedge, AnnularWedge, ImageURL
from bokeh.objects import ColumnDataSource, Plot, Glyph, Range1d
from bokeh.colors import skyblue, limegreen, orange, purple, orangered, lightgray
from bokeh.sampledata.browsers import browsers_nov_2013, icons

df = browsers_nov_2013

xdr = Range1d(start=-2, end=2)
ydr = Range1d(start=-2, end=2)

title = "Web browser market share (November 2013)"
plot = Plot(title=title, x_range=xdr, y_range=ydr, width=800, height=800)

colors = {"Chrome": limegreen, "Firefox": orange, "Safari": purple, "Opera": orangered, "IE": skyblue, "Other": lightgray}

aggregated = df.groupby("Browser").agg(sum)
selected = aggregated[aggregated.Share >= 1]
browsers = selected.index.tolist() + ["Other"]

radians = lambda x: 2*pi*(x/100)
angles = selected.Share.map(radians).cumsum()

end_angles = angles.tolist() + [2*pi]
start_angles = [0] + end_angles[:-1]

browsers_source = ColumnDataSource(dict(
    start  = start_angles,
    end    = end_angles,
    colors = [colors[browser] for browser in browsers ],
))
plot.data_sources.append(browsers_source)

glyph = Wedge(x=0, y=0, radius=1, start_angle="start", end_angle="end", fill_color="colors")
renderer = Glyph(data_source=browsers_source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
plot.renderers.append(renderer)

for browser, start_angle, end_angle in zip(browsers, start_angles, end_angles):
    versions = df[(df.Browser == browser) & (df.Share >= 0.5)]
    angles = versions.Share.map(radians).cumsum() + start_angle
    end = angles.tolist() + [end_angle]
    start = [start_angle] + end[:-1]
    base_color = colors[browser]
    fill = [ base_color.lighten(i*0.05) for i in range(len(versions) + 1) ]
    source = ColumnDataSource(dict(start=start, end=end, fill=fill))
    glyph = AnnularWedge(x=0, y=0, inner_radius=1, outer_radius=1.5, start_angle="start", end_angle="end", fill_color="fill")
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.data_sources.append(source)
    plot.renderers.append(renderer)

def to_base64(png):
    return "data:image/png;base64," + base64.b64encode(png).decode("utf-8")

def polar_to_cartesian(r, alpha):
    return r*cos(alpha), r*sin(alpha)

r, points = 1.7, []

for start, end in zip(start_angles, end_angles):
    points.append(polar_to_cartesian(r, (end - start)/2 + start))

urls = [ to_base64(icons.get(browser, b"")) for browser in browsers ]
x, y = zip(*points)

icons_source = ColumnDataSource(dict(urls=urls, x=x, y=y))
plot.data_sources.append(icons_source)

glyph = ImageURL(url="urls", x="x", y="y", angle=0.0, anchor="center")
renderer = Glyph(data_source=icons_source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
plot.renderers.append(renderer)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "donut.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Donut Chart"))
    print("Wrote %s" % filename)
    view(filename)
