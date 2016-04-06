from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan  # noqa
import pandas as pd

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Row, Column,
    ResizeTool, PanTool, FactorRange, CategoricalAxis, Rect, Slider
)
from bokeh.resources import INLINE

css3_colors = pd.DataFrame([
    ("Pink",                  "#FFC0CB", "Pink"),
    ("LightPink",             "#FFB6C1", "Pink"),
    ("FireBrick",             "#B22222", "Red"),
    ("DarkRed",               "#8B0000", "Red"),
    ("Red",                   "#FF0000", "Red"),
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


def make_plot(yname, line_color, below_axis=True, left_axis=True, right_axis=False, border_fill_color="white"):
    """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a GridPlot, and the latter is added to the plotcontext.
    """
    plot = Plot(
        x_range=DataRange1d(),
        y_range=DataRange1d(),
        min_border=15,
        border_fill_color=border_fill_color,
        border_fill_alpha=0.1,
        toolbar_location=None,
    )
    if below_axis:
        plot.add_layout(LinearAxis(), 'below')
    else:
        plot.add_layout(LinearAxis(), 'above')
    if left_axis:
        plot.add_layout(LinearAxis(), 'left')
    if right_axis:
        plot.add_layout(LinearAxis(), 'right')
    plot.add_glyph(source, Line(x="x", y=yname, line_color=line_color))
    plot.add_tools(PanTool())
    return plot

plot1 = make_plot("y1", "blue", below_axis=False, border_fill_color="Thistle")
plot2 = make_plot("y2", "red", right_axis=True)
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

slider = Slider(start=0, end=10, value=1, step=1, title="Stuff")
row1 = Row(children=[plot1, plot2])
row2col1 = Column(children=[plot3, slider])
row2 = Row(children=[row2col1, cat_plot])
row3 = Row(children=[plot3, plot4])


doc = Document()
doc.add_root(Column(children=[plot1, slider]))
#doc.add_root(Column(children=[Row(children=[plot1, plot2, plot3, plot4]), slider]))
#doc.add_root(row1)
#doc.add_root(Column(children=[row1, row2]))

if __name__ == "__main__":
    filename = "grid_layout.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Layout"))
    print("Wrote %s" % filename)
    view(filename)
