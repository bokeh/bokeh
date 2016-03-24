from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan  # noqa
import pandas as pd

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Row, Column, ResizeTool,
    FactorRange, CategoricalAxis, Rect,
)
from bokeh.resources import INLINE

css3_colors = pd.DataFrame([
    ("Pink",                  "#FFC0CB", "Pink"),
    ("LightPink",             "#FFB6C1", "Pink"),
    ("FireBrick",             "#B22222", "Red"),
    ("DarkRed",               "#8B0000", "Red"),
    ("Red",                   "#FF0000", "Red"),
    ("OrangeRed",             "#FF4500", "Orange"),
    ("Orange",                "#FFA500", "Orange"),
    ("Yellow",                "#FFFF00", "Yellow"),
    ("Gold",                  "#FFD700", "Yellow"),
    ("Cornsilk",              "#FFF8DC", "Brown"),
    ("Brown",                 "#A52A2A", "Brown"),
    ("Maroon",                "#800000", "Brown"),
    ("DarkOliveGreen",        "#556B2F", "Green"),
    ("Olive",                 "#808000", "Green"),
    ("DarkGreen",             "#006400", "Green"),
    ("MediumAquamarine",      "#66CDAA", "Cyan"),
    ("Aqua",                  "#00FFFF", "Cyan"),
    ("Cyan",                  "#00FFFF", "Cyan"),
    ("Teal",                  "#008080", "Cyan"),
    ("LightSteelBlue",        "#B0C4DE", "Blue"),
    ("PowderBlue",            "#B0E0E6", "Blue"),
    ("LightBlue",             "#ADD8E6", "Blue"),
    ("Navy",                  "#000080", "Blue"),
    ("MidnightBlue",          "#191970", "Blue"),
    ("Lavender",              "#E6E6FA", "Purple"),
    ("Thistle",               "#D8BFD8", "Purple"),
    ("Plum",                  "#DDA0DD", "Purple"),
    ("MediumSlateBlue",       "#7B68EE", "Purple"),
    ("White",                 "#FFFFFF", "White"),
    ("Snow",                  "#FFFAFA", "White"),
    ("Honeydew",              "#F0FFF0", "White"),
    ("LavenderBlush",         "#FFF0F5", "White"),
    ("MistyRose",             "#FFE4E1", "White"),
    ("Gainsboro",             "#DCDCDC", "Gray/Black"),
    ("SlateGray",             "#708090", "Gray/Black"),
    ("DarkSlateGray",         "#2F4F4F", "Gray/Black"),
    ("Black",                 "#000000", "Gray/Black"),
], columns=["Name", "Color", "Group"])

x = linspace(-2 * pi, 2 * pi, 1000)

source = ColumnDataSource(data=dict(
    x=x,
    y1=sin(x),
    y2=cos(x),
    y3=tan(x),
    y4=sin(x) * cos(x),
))


def make_plot(yname, line_color, below_axis=True, left_axis=True):
    """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a GridPlot, and the latter is added to the plotcontext.
    """
    plot = Plot(
        x_range=DataRange1d(),
        y_range=DataRange1d(),
        min_border=10,
        border_fill_color="Coral",
        border_fill_alpha=0.3,
        outline_line_color=None,
        background_fill_color="Thistle",
        background_fill_alpha=0.3,
    )
    if below_axis:
        plot.add_layout(LinearAxis(), 'below')
    else:
        plot.add_layout(LinearAxis(), 'above')
    if left_axis:
        plot.add_layout(LinearAxis(), 'left')
    plot.add_glyph(source, Line(x="x", y=yname, line_color=line_color))
    plot.add_tools(ResizeTool())
    return plot

plot1 = make_plot("y1", "blue", below_axis=False)
plot2 = make_plot("y2", "red")
plot3 = make_plot("y3", "green", left_axis=False)
plot4 = make_plot("y4", "black", left_axis=False, below_axis=False)

# Categorical plot
source = ColumnDataSource(dict(
    names  = list(css3_colors.Name),
    groups = list(css3_colors.Group),
    colors = list(css3_colors.Color),
))
xdr = FactorRange(factors=list(css3_colors.Group.unique()))
ydr = FactorRange(factors=list(reversed(css3_colors.Name)))
cat_plot = Plot(title="CSS3 Color Names", x_range=xdr, y_range=ydr, min_border=1)
rect = Rect(x="groups", y="names", width=1, height=1, fill_color="colors", line_color=None)
cat_plot.add_glyph(source, rect)
xaxis = CategoricalAxis(major_label_orientation=pi/4)
cat_plot.add_layout(xaxis, 'below')
cat_plot.add_layout(CategoricalAxis(), 'left')

row1 = Row(children=[plot1, plot2])
row2col1 = Column(children=[plot3, plot4])
row2col2 = Column(children=[cat_plot])
row2 = Row(children=[row2col1, row2col2])

doc = Document()
doc.add_root(Column(children=[row1, row2]))

if __name__ == "__main__":
    filename = "grid_layout.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Layout"))
    print("Wrote %s" % filename)
    view(filename)
