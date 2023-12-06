import numpy as np

from bokeh.core.properties import value
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (AnnularWedge, Annulus, Arc, Bezier, Circle, Column,
                          ColumnDataSource, Ellipse, Grid, HoverTool, ImageURL,
                          Line, LinearAxis, MultiLine, MultiPolygons, Paragraph,
                          Patch, Patches, Plot, Quad, Quadratic, Ray, Rect,
                          Scatter, Segment, TabPanel, Tabs, Text, Wedge)
from bokeh.util.browser import view

N = 9

x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(10, 20, N)
radii = np.linspace(0.1, 0.8, N)

xpts = np.array([-.09, -.12, .0, .12, .09])
ypts = np.array([-.1, .02, .1, .02, -.1])

xs = [ xpts + xx for xx in x ]
ys = [ ypts + yy for yy in y ]

source = ColumnDataSource(dict(
    x = x,
    y = y,
    sizes = sizes,
    radii = radii,
    xs = xs,
    ys = ys,
    xsss = [[[x]] for x in xs],
    ysss = [[[y]] for y in ys],
    xp02 = x + 0.2,
    xp01 = x + 0.1,
    xm01 = x - 0.1,
    yp01 = y + 0.1,
    ym01 = y - 0.1,
))

print()

def screen(val: float):
    return value(val, units="screen")

glyphs = [
    ("annular_wedge", AnnularWedge(x="x", y="y", inner_radius=screen(10), outer_radius=screen(20), start_angle=0.6, end_angle=4.1, fill_color="#8888ee")),
    ("annulus", Annulus(x="x", y="y", inner_radius=screen(10), outer_radius=screen(20), fill_color="#7FC97F")),
    ("arc", Arc(x="x", y="y", radius=screen(20), start_angle=0.6, end_angle=4.1, line_color="#BEAED4", line_width=3)),
    ("bezier", Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01", line_color="#D95F02", line_width=2)),
    ("circle", Circle(x="x", y="y", radius="radii",  fill_color="#3288BD")),
    ("ellipse", Ellipse(x="x", y="y", width=screen(15), height=screen(25), angle=-0.7, fill_color="#1D91C0")),
    ("image_url",  ImageURL(x="x", y="y", w=0.4, h=0.4, url=value("https://static.bokeh.org/logos/logo.png"), anchor="center")),
    ("line", Line(x="x", y="y", line_color="#F46D43")),
    ("multi_line", MultiLine(xs="xs", ys="ys", line_color="#8073AC", line_width=2)),
    ("multi_polygons", MultiPolygons(xs="xsss", ys="ysss", line_color="#8073AC", fill_color="#FB9A99", line_width=2)),
    ("patch", Patch(x="x", y="y", fill_color="#A6CEE3")),
    ("patches", Patches(xs="xs", ys="ys", fill_color="#FB9A99")),
    ("quad", Quad(left="x", right="xp01", top="y", bottom="ym01", fill_color="#B3DE69")),
    ("quadratic", Quadratic(x0="x", y0="y", x1="xp02", y1="y", cx="xp01", cy="yp01", line_color="#4DAF4A", line_width=3)),
    ("ray", Ray(x="x", y="y", length=45, angle=-0.7, line_color="#FB8072", line_width=2)),
    ("rect", Rect(x="x", y="y", width=screen(10), height=screen(20), angle=-0.7, fill_color="#CAB2D6")),
    ("segment", Segment(x0="x", y0="y", x1="xm01", y1="ym01", line_color="#F4A582", line_width=3)),
    ("text", Text(x="x", y="y", text=value("hello"))),
    ("wedge", Wedge(x="x", y="y", radius=screen(15), start_angle=0.6, end_angle=4.1, fill_color="#B3DE69")),
]

markers = [
    ("circle", Scatter(x="x", y="y", size="sizes",  fill_color="#3288BD", marker="circle")),
    ("circle_x", Scatter(x="x", y="y", size="sizes", line_color="#DD1C77", fill_color=None, marker="circle_x")),
    ("circle_cross", Scatter(x="x", y="y", size="sizes", line_color="#FB8072", fill_color=None, line_width=2, marker="circle_x")),
    ("square", Scatter(x="x", y="y", size="sizes", fill_color="#74ADD1", marker="square")),
    ("square_x", Scatter(x="x", y="y", size="sizes", line_color="#FDAE6B", fill_color=None, line_width=2, marker="square_x")),
    ("square_cross", Scatter(x="x", y="y", size="sizes", line_color="#7FC97F", fill_color=None, line_width=2, marker="square_cross")),
    ("diamond", Scatter(x="x", y="y", size="sizes", line_color="#1C9099", line_width=2, marker="diamond")),
    ("diamond_cross", Scatter(x="x", y="y", size="sizes", line_color="#386CB0", fill_color=None, line_width=2, marker="diamond_cross")),
    ("triangle", Scatter(x="x", y="y", size="sizes", line_color="#99D594", line_width=2, marker="triangle")),
    ("inverted_triangle", Scatter(x="x", y="y", size="sizes", line_color="#DE2D26", line_width=2, marker="inverted_triangle")),
    ("cross", Scatter(x="x", y="y", size="sizes", line_color="#E6550D", fill_color=None, line_width=2, marker="cross")),
    ("asterisk", Scatter(x="x", y="y", size="sizes", line_color="#F0027F", fill_color=None, line_width=2, marker="asterisk")),
    ("x", Scatter(x="x", y="y", size="sizes", line_color="thistle", fill_color=None, line_width=2, marker="x")),
    ("hex", Scatter(x="x", y="y", size="sizes", line_color="#99D594", line_width=2, marker="hex")),
    ("dash", Scatter(x="x", y="y", size="sizes", angle=0.5, line_color="#386CB0", line_width=1, marker="dash")),
]

def make_tab(title, glyph):
    plot = Plot()
    plot.title.text = title

    plot.add_glyph(source, glyph)

    xaxis = LinearAxis()
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis()
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    plot.add_tools(HoverTool())

    tab = TabPanel(child=plot, title=title, closable=True)
    return tab

def make_tabs(objs):
    return Tabs(tabs=[ make_tab(title, obj) for title, obj in objs ], width=600)

layout = Column(children=[Paragraph(text="Only Image and ImageRGBA glyphs are not demonstrated."), make_tabs(glyphs), make_tabs(markers)])

doc = Document()
doc.add_root(layout)

if __name__ == "__main__":
    doc.validate()
    filename = "glyphs.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="Glyphs"))
    print(f"Wrote {filename}")
    view(filename)
