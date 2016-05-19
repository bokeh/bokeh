from __future__ import print_function

from numpy import pi, sin, cos, linspace, tan  # noqa

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Line
from bokeh.models import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Row, Column, PanTool, Slider, Dropdown, Button
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

slider_1 = Slider(start=0, end=10, value=1, step=1, title="Stuff1")
slider_2 = Slider(start=0, end=10, value=1, step=1, title="Stuff2")
slider_3 = Slider(start=0, end=10, value=1, step=1, title="Stuff2")
slider_4 = Slider(start=0, end=10, value=1, step=1, title="Stuff2")

menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
dropdown = Dropdown(label="Dropdown button", menu=menu)
msg = "Returns a tuple (plot, [obj1...objN]); the former can be added to a GridPlot, and the latter is added to the plotcontext."
button_1 = Button(label=msg)
button_2 = Button(label=msg)
button_3 = Button(label=msg)
button_4 = Button(label=msg)
doc = Document()


def add_axes(plot, below_axis=True, left_axis=True, right_axis=False, above_axis=False):
    if above_axis:
        plot.add_layout(LinearAxis(), 'above')
    if below_axis:
        plot.add_layout(LinearAxis(), 'below')
    if left_axis:
        plot.add_layout(LinearAxis(), 'left')
    if right_axis:
        plot.add_layout(LinearAxis(), 'right')
    return plot

toolbar_locations = [None, 'above', 'left', 'below', 'right']

def make_plot(yname, line_color, above_axis=False, below_axis=True, left_axis=True, right_axis=False, border_fill_color="white", toolbar_location_index=0, plot_width=600, plot_height=300):
    plot = Plot(
        x_range=DataRange1d(),
        y_range=DataRange1d(),
        border_fill_color=border_fill_color,
        toolbar_location=toolbar_locations[toolbar_location_index],
        plot_width=plot_width,
        plot_height=plot_height,
        min_border=10,
    )
    plot.add_glyph(source, Line(x="x", y=yname, line_color=line_color))
    plot.add_tools(PanTool())
    plot = add_axes(plot, below_axis=below_axis, left_axis=left_axis, right_axis=right_axis, above_axis=above_axis)
    return plot

# ----- SET TOOLBAR LOCATION
TOOLBAR_LOCATION = 1
suffix = "_%s" % toolbar_locations[TOOLBAR_LOCATION]

plot_1 = make_plot("y1", "blue", toolbar_location_index=TOOLBAR_LOCATION, border_fill_color="Thistle")
plot_2 = make_plot("y2", "red", right_axis=True, toolbar_location_index=TOOLBAR_LOCATION)
plot_3 = make_plot("y3", "green", left_axis=False, toolbar_location_index=0)
plot_4 = make_plot("y4", "black", left_axis=False, below_axis=False, toolbar_location_index=2)


#doc.add_root(plot_2)
#doc.add_root(plot_3)
#doc.add_root(slider_1)
col1 = Column(Row(plot_1), Row(plot_2))
col2 = Column(Row(plot_3), Row(plot_4))
doc.add_root(Row(col1, col2))
#doc.add_root(Column(plot_1, plot_2))
#doc.add_root(Column(Row(plot_1, plot_2), Row(plot_3, plot_4)))
#doc.add_root(Column(Row(button_1, button_2), Row(button_3, button_4)))


#row1 = Row(children=[plot_1, plot_2])
#row2col1 = Column(children=[plot_3, plot_4])
#row2col2 = Column(children=[slider_1, button, dropdown])
#row2 = Row(children=[row2col1, row2col2])
#widgetcol = row2col2
#doc.add_root(Column(
#    children=[
##        button,
#         slider_1,
#        Column(
#            children=[
#                Row(children=[plot_1, plot_2]),
#                Row(children=[plot_3, plot_4])
#            ]
#        )
#    ]
#))
#doc.add_root(row1)
#doc.add_root(row2col1)
#doc.add_root(Row(children=[plot_1, Column(children=[plot_2, plot_3, plot_4])]))
#doc.add_root(Column(children=[row1, row2]))
#doc.add_root(Column(children=[slider_1, button, plot_1, plot_2])
#doc.add_root(Row(children=[Column(children=[slider_1, button]), plot_1]))
#doc.add_root(Column(children=[plot_1, plot_2, slider_1, button]))

#doc.add_root(Column(children=[plot_1, slider_1, plot_2, button, plot_3, slider_2]))

#row1 = Row(children=[Column(children=[slider_1, plot_1])])
#row2 = Row(children=[Column(children=[button, plot_2])])
#doc.add_root(Column(children=[row1, row2]))

#row1 = Row(
#    children=[
#        Column(children=[slider_1, plot_1]),
#        Column(children=[slider_2, plot_2]),
#    ]
#)
#row2 = Row(
#    children=[
#        Column(children=[slider_3, plot_3]),
#        Column(children=[slider_4, plot_4]),
#    ]
#)
#doc.add_root(Column(children=[row1, row2]))


if __name__ == "__main__":
    filename = "test_grid_layout%s.html" % suffix
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Grid Layout"))
    print("Wrote %s" % filename)
    view(filename)
