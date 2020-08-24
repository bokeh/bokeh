import numpy as np

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (AnnularWedge, Annulus, Arc, Asterisk, Bezier, Circle,
                          CircleCross, CircleX, Column, ColumnDataSource, Cross,
                          Dash, Diamond, DiamondCross, Ellipse, Grid, Hex, HoverTool,
                          ImageURL, InvertedTriangle, Line, LinearAxis, MultiLine,
                          MultiPolygons, Panel, Paragraph, Patch, Patches, Plot,
                          Quad, Quadratic, Ray, Rect, Segment, Square, SquareCross,
                          SquareX, Tabs, Text, Triangle, Wedge, X,)
from bokeh.resources import INLINE
from bokeh.util.browser import view

N = 9

x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(10, 20, N)

xpts = np.array([-.09, -.12, .0, .12, .09])
ypts = np.array([-.1, .02, .1, .02, -.1])

xs = [ xpts + xx for xx in x ]
ys = [ ypts + yy for yy in y ]

source = ColumnDataSource(dict(
    x = x,
    y = y,
    sizes = sizes,
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

def screen(value):
    return dict(value=value, units="screen")

glyphs = [
    ("annular_wedge", AnnularWedge(x="x", y="y", inner_radius=screen(10), outer_radius=screen(20), start_angle=0.6, end_angle=4.1, fill_color="#8888ee")),
    ("annulus", Annulus(x="x", y="y", inner_radius=screen(10), outer_radius=screen(20), fill_color="#7FC97F")),
    ("arc", Arc(x="x", y="y", radius=screen(20), start_angle=0.6, end_angle=4.1, line_color="#BEAED4", line_width=3)),
    ("bezier", Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01", line_color="#D95F02", line_width=2)),
    ("ellipse", Ellipse(x="x", y="y", width=screen(15), height=screen(25), angle=-0.7, fill_color="#1D91C0")),
    ("image_url",  ImageURL(x="x", y="y", w=0.4, h=0.4, url=dict(value="https://static.bokeh.org/logos/logo.png"), anchor="center")),
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
    ("text", Text(x="x", y="y", text=["hello"])),
    ("wedge", Wedge(x="x", y="y", radius=screen(15), start_angle=0.6, end_angle=4.1, fill_color="#B3DE69")),
]

markers = [
    ("circle", Circle(x="x", y="y", radius=0.1, fill_color="#3288BD")),
    ("circle_x", CircleX(x="x", y="y", size="sizes", line_color="#DD1C77", fill_color=None)),
    ("circle_cross", CircleCross(x="x", y="y", size="sizes", line_color="#FB8072", fill_color=None, line_width=2)),
    ("square", Square(x="x", y="y", size="sizes", fill_color="#74ADD1")),
    ("square_x", SquareX(x="x", y="y", size="sizes", line_color="#FDAE6B", fill_color=None, line_width=2)),
    ("square_cross", SquareCross(x="x", y="y", size="sizes", line_color="#7FC97F", fill_color=None, line_width=2)),
    ("diamond", Diamond(x="x", y="y", size="sizes", line_color="#1C9099", line_width=2)),
    ("diamond_cross", DiamondCross(x="x", y="y", size="sizes", line_color="#386CB0", fill_color=None, line_width=2)),
    ("triangle", Triangle(x="x", y="y", size="sizes", line_color="#99D594", line_width=2)),
    ("inverted_triangle", InvertedTriangle(x="x", y="y", size="sizes", line_color="#DE2D26", line_width=2)),
    ("cross", Cross(x="x", y="y", size="sizes", line_color="#E6550D", fill_color=None, line_width=2)),
    ("asterisk", Asterisk(x="x", y="y", size="sizes", line_color="#F0027F", fill_color=None, line_width=2)),
    ("x", X(x="x", y="y", size="sizes", line_color="thistle", fill_color=None, line_width=2)),
    ("hex", Hex(x="x", y="y", size="sizes", line_color="#99D594", line_width=2)),
    ("dash", Dash(x="x", y="y", size="sizes", angle=0.5, line_color="#386CB0", line_width=1)),
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

    tab = Panel(child=plot, title=title, closable=True)

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
        f.write(file_html(doc, INLINE, "Glyphs"))
    print("Wrote %s" % filename)
    view(filename)
