from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool
)
from bokeh.resources import INLINE

source = ColumnDataSource(
    data = dict(
        x = [1, 2, 3, 4, 4,   5, 5],
        y = [5, 4, 3, 2, 2.1, 1, 1.1],
        color = ["rgb(0, 100, 120)", "green", "blue", "#2c7fb8", "#2c7fb8", "rgba(120, 230, 150, 0.5)", "rgba(120, 230, 150, 0.5)"]
    )
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr)

circle = Circle(x="x", y="y", radius=0.2,
    # Set the fill color to be dependent on the "color" field of the
    # data source.  If the field is missing, then the default value is
    # used. Since no explicit default is provided, this picks up the
    # default in FillProps, which is "gray".
    fill_color="color",

    # Alternative to using fill_color with rgba values, you can also use
    # the fill_alpha setting to set the alpha values of your circle or
    # other glyphs. This can be set as a single value or powered by a
    # column in your data source. Uncomment the following line
    # to see the effect.
    # fill_alpha=0.2,

    # An alternative form that explicitly sets a default value:
    #fill_color={"default": "red", "field": "color"},

    # Note that line_color is set to a fixed value. This can be any of
    # the SVG named 147 colors, or a hex color string starting with "#",
    # or a string "rgb(r,g,b)" or "rgba(r,g,b,a)".
    # Any other string will be interpreted as a field name to look up
    # on the datasource.
    line_color="black")

plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "colorspec.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of ColorSpec"))
    print("Wrote %s" % filename)
    view(filename)
