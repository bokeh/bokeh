from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan  # noqa

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Row, Column,
    PanTool, Slider, Dropdown, Button, Spacer,
)
from bokeh.resources import INLINE

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
        min_border=1,
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
plot1.min_border = 8
plot2 = make_plot("y2", "red", right_axis=True)
plot3 = make_plot("y3", "green", left_axis=False)
plot4 = make_plot("y4", "black", left_axis=False, below_axis=False)

slider = Slider(start=0, end=10, value=1, step=1, title="Stuff")
menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
dropdown = Dropdown(label="Dropdown button", menu=menu)
msg = """ Returns a tuple (plot, [obj1...objN]); the former can be added
    to a GridPlot, and the latter is added to the plotcontext.
    """
button = Button(label=msg)
row1 = Row(children=[plot1, plot2])
row2col1 = Column(children=[plot3, plot4])
widgetcol = Column(children=[slider, button, dropdown, Spacer()])
row2 = Row(children=[row2col1, widgetcol])


doc = Document()
#doc.add_root(Column(
#    children=[
##        button,
#         slider,
#        Column(
#            children=[
#                Row(children=[plot1, plot2]),
#                Row(children=[plot3, plot4])
#            ]
#        )
#    ]
#))  # works (with either)
#doc.add_root(row1) # works
#doc.add_root(row2col1) # works
#doc.add_root(Row(children=[plot1, Column(children=[plot2, plot3, plot4])])) # works
#doc.add_root(Column(children=[row1, row2]))  # works (with spacer)
#doc.add_root(Column(children=[slider, button, plot1, plot2])) # works

#row1 = Row(children=[Column(children=[slider, plot1])])
#row2 = Row(children=[Column(children=[button, plot2])]
#doc.add_root(Column(children=[row1, row2]))  # works

#doc.add_root(Column(children=[plot1, plot2, slider, button])) # Doesn't work (things spill out)
#doc.add_root(Column(children=[plot1, slider, plot2, button])) # Doesn't work - can't split widgets (things spill out)
#doc.add_root(Row(children=[Column(children=[slider, button]), plot1]))  # Doesn't work - widgets ontop of each other

if __name__ == "__main__":
    filename = "grid_layout_4.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Layout"))
    print("Wrote %s" % filename)
    view(filename)
