from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Circle
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph, PanTool, WheelZoomTool
)
from bokeh.resources import INLINE

source = ColumnDataSource(
    data = dict(
        x = [1,2,3,4,5],
        y = [5,4,3,2,1],
        color = ["rgb(0, 100, 120)", "green", "blue", "#2c7fb8", "rgba(120, 230, 150, 0.5)"]
    )
)

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", size=15,
    # Set the fill color to be dependent on the "color" field of the
    # datasource.  If the field is missing, then the default value is
    # used. Since no explicit default is provided, this picks up the
    # default in FillProps, which is "gray".
    fill_color="color",

    # An alternative form that explicitly sets a default value:
    #fill_color={"default": "red", "field": "color"},

    # Note that line_color is set to a fixed value. This can be any of
    # the SVG named 147 colors, or a hex color string starting with "#",
    # or a string "rgb(r,g,b)" or "rgba(r,g,b,a)".
    # Any other string will be interpreted as a field name to look up
    # on the datasource.
    line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source])
xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
plot.left.append(yaxis)

pantool = PanTool(dimensions=["width", "height"])
wheelzoomtool = WheelZoomTool(dimensions=["width", "height"])

plot.renderers.append(glyph_renderer)
plot.tools = [pantool, wheelzoomtool]

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "colorspec.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of ColorSpec"))
    print("Wrote %s" % filename)
    view(filename)
