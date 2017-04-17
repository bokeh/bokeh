from __future__ import print_function

import base64
from math import pi, sin, cos

from bokeh.util.browser import view
from bokeh.colors import skyblue, seagreen, tomato, orchid, firebrick, lightgray
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Wedge, AnnularWedge, ImageURL, Text
from bokeh.models import ColumnDataSource, Plot, Range1d
from bokeh.resources import INLINE
from bokeh.sampledata.browsers import browsers_nov_2013, icons

df = browsers_nov_2013

xdr = Range1d(start=-2, end=2)
ydr = Range1d(start=-2, end=2)

plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
plot.title.text = "Web browser market share (November 2013)"
plot.toolbar_location = None

colors = {"Chrome": seagreen, "Firefox": tomato, "Safari": orchid, "Opera": firebrick, "IE": skyblue, "Other": lightgray}

aggregated = df.groupby("Browser").agg(sum)
selected = aggregated[aggregated.Share >= 1].copy()
selected.loc["Other"] = aggregated[aggregated.Share < 1].sum()
browsers = selected.index.tolist()

radians = lambda x: 2*pi*(x/100)
angles = selected.Share.map(radians).cumsum()

end_angles = angles.tolist()
start_angles = [0] + end_angles[:-1]

browsers_source = ColumnDataSource(dict(
    start  = start_angles,
    end    = end_angles,
    colors = [colors[browser] for browser in browsers ],
))

glyph = Wedge(x=0, y=0, radius=1, line_color="white",
    line_width=2, start_angle="start", end_angle="end", fill_color="colors")
plot.add_glyph(browsers_source, glyph)

def polar_to_cartesian(r, start_angles, end_angles):
    cartesian = lambda r, alpha: (r*cos(alpha), r*sin(alpha))
    points = []

    for start, end in zip(start_angles, end_angles):
        points.append(cartesian(r, (end + start)/2))

    return zip(*points)

first = True

for browser, start_angle, end_angle in zip(browsers, start_angles, end_angles):
    versions = df[(df.Browser == browser) & (df.Share >= 0.5)]
    angles = versions.Share.map(radians).cumsum() + start_angle
    end = angles.tolist() + [end_angle]
    start = [start_angle] + end[:-1]
    base_color = colors[browser]
    fill = [ base_color.lighten(i*0.05) for i in range(len(versions) + 1) ]
    text = [ number if share >= 1 else "" for number, share in zip(versions.VersionNumber, versions.Share) ]
    x, y = polar_to_cartesian(1.25, start, end)

    source = ColumnDataSource(dict(start=start, end=end, fill=fill))
    glyph = AnnularWedge(x=0, y=0,
        inner_radius=1, outer_radius=1.5, start_angle="start", end_angle="end",
        line_color="white", line_width=2, fill_color="fill")
    plot.add_glyph(source, glyph)


    text_angle = [(start[i]+end[i])/2 for i in range(len(start))]
    text_angle = [angle + pi if pi/2 < angle < 3*pi/2 else angle for angle in text_angle]

    if first and text:
        text.insert(0, '(version)')
        offset = pi / 48
        text_angle.insert(0, text_angle[0] - offset)
        start.insert(0, start[0] - offset)
        end.insert(0, end[0] - offset)
        x, y = polar_to_cartesian(1.25, start, end)
        first = False

    text_source = ColumnDataSource(dict(text=text, x=x, y=y, angle=text_angle))
    glyph = Text(x="x", y="y", text="text", angle="angle",
        text_align="center", text_baseline="middle")
    plot.add_glyph(text_source, glyph)


def to_base64(png):
    return "data:image/png;base64," + base64.b64encode(png).decode("utf-8")

urls = [ to_base64(icons.get(browser, b"")) for browser in browsers ]
x, y = polar_to_cartesian(1.7, start_angles, end_angles)

icons_source = ColumnDataSource(dict(urls=urls, x=x, y=y))
glyph = ImageURL(url="urls", x="x", y="y", anchor="center")
plot.add_glyph(icons_source, glyph)

text = [ "%.02f%%" % value for value in selected.Share ]
x, y = polar_to_cartesian(0.7, start_angles, end_angles)

text_source = ColumnDataSource(dict(text=text, x=x, y=y))
glyph = Text(x="x", y="y", text="text", text_align="center", text_baseline="middle")
plot.add_glyph(text_source, glyph)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "donut.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Donut Chart"))
    print("Wrote %s" % filename)
    view(filename)
