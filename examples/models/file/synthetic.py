from __future__ import print_function

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.util.browser import view
from bokeh.resources import INLINE
from bokeh.models.glyphs import Circle, Line
from bokeh.models import (ColumnDataSource, Range1d, Plot, LinearAxis, Grid,
    HoverTool, CrosshairTool, TapTool, WheelZoomTool, Legend, LegendItem, CustomJS)

plot = Plot(x_range=Range1d(-10, 10), y_range=Range1d(-10, 10), plot_width=500, plot_height=500, toolbar_sticky=False)

xaxis = LinearAxis()
yaxis = LinearAxis()
xgrid = Grid(dimension=0, ticker=xaxis.ticker)
ygrid = Grid(dimension=1, ticker=yaxis.ticker)

plot.add_layout(xaxis, "below")
plot.add_layout(yaxis, "left")
plot.add_layout(xgrid)
plot.add_layout(ygrid)

def fds(x, y, e, n):
    d = [
        (x+0*e, y+0*e, 1, "red",    "%s00" % n),
        (x+1*e, y+1*e, 1, "blue",   "%s01" % n),
        (x+2*e, y+2*e, 1, "green",  "%s02" % n),
        (x+3*e, y+3*e, 1, "violet", "%s03" % n),
        (x+4*e, y+4*e, 1, "pink",   "%s04" % n),
        (x+5*e, y+5*e, 1, "black",  "%s05" % n),
        (x+6*e, y+6*e, 1, "gray",   "%s06" % n),
        (x+7*e, y+7*e, 1, "olive",  "%s07" % n),
        (x+8*e, y+8*e, 1, "yellow", "%s08" % n),
        (x+9*e, y+9*e, 1, "orange", "%s09" % n),
    ]
    f = lambda i: [ t[i] for t in d ]
    return dict(x=f(0), y=f(1), s=f(2), c=f(3), name=f(4))

ds1 = ColumnDataSource(data=fds(0, 0, 0.1, "c"))
cr1 = plot.add_glyph(ds1, Circle(x="x", y="y", radius="s", fill_color="c", line_color="c"))

ds2 = ColumnDataSource(data=fds(-5, 5, 0.5, "d"))
cr2 = plot.add_glyph(ds2, Circle(x="x", y="y", radius="s", fill_color="c", line_color="c"))
ln2 = plot.add_glyph(ds2, Line(x="x", y="y", line_width=3, line_color="red"))

ds3 = ColumnDataSource(data=fds(5, 5, 0.0, "e"))
cr3 = plot.add_glyph(ds3, Circle(x="x", y="y", radius="s", fill_color="c", line_color="c"))

tooltips = "<b>@name</b> = (@x{0.00}, @y{0.00})"

hover = HoverTool(tooltips=tooltips, renderers=[cr1, cr2, ln2, cr3], point_policy="follow_mouse")
plot.add_tools(hover)

crosshair = CrosshairTool()
plot.add_tools(crosshair)

tap = TapTool(renderers=[cr1, cr2, cr3], callback=CustomJS(code="console.log('TAP')"))
plot.add_tools(tap)

wheelzoom = WheelZoomTool()
plot.add_tools(wheelzoom)

legends = lambda: [
    LegendItem(label="CR1", renderers=[cr1]),
    LegendItem(label="CR2", renderers=[cr2, ln2]),
    LegendItem(label="CR3", renderers=[cr3]),
]
legend = lambda **kwargs: Legend(background_fill_alpha=0.7, items=legends(), click_policy="hide", **kwargs)

plot.add_layout(legend(location="center_left", orientation="vertical"))
plot.add_layout(legend(location="center", orientation="vertical"))
plot.add_layout(legend(location="top_center", orientation="horizontal"))
plot.add_layout(legend(location="top_right", orientation="horizontal"))
plot.add_layout(legend(location="bottom_right", orientation="horizontal"))
plot.add_layout(legend(location=(0, 0), orientation="vertical", name="(0, 0)"))
plot.add_layout(legend(location="center", orientation="horizontal", name="above"), 'above')
plot.add_layout(legend(location="center", orientation="horizontal", name="below"), 'below')
plot.add_layout(legend(location="center", orientation="vertical", name="left"), 'left')
plot.add_layout(legend(location="center", orientation="vertical", name="right"), 'right')

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    filename = "synthetic.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "A synthetic example"))
    print("Wrote %s" % filename)
    view(filename)
