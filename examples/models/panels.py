from bokeh.io import show
from bokeh.models import ColumnDataSource, LinearAxis, Plot, Range1d, Scatter, Title

p = Plot(
    title=None, toolbar_location=None,
    width=800, height=800,
    min_border=30,
    background_fill_color="#F0F0F0",
    border_fill_color="lightgray")

p.extra_x_ranges["x"] = Range1d(0, 100)
p.extra_y_ranges["y"] = Range1d(0, 100)

source = ColumnDataSource(dict(x=[1.0, 2.0, 3.0], y=[1.0, 2.0, 3.0]))

p.add_layout(LinearAxis(axis_label="x_label"), "above")
p.add_layout(LinearAxis(x_range_name="x"), "above")

p.add_layout(LinearAxis(axis_label="x_label"), "below")
p.add_layout(LinearAxis(x_range_name="x"), "below")

p.add_layout(LinearAxis(axis_label="y_label"), "left")
p.add_layout(LinearAxis(y_range_name="y"), "left")

p.add_layout(LinearAxis(axis_label="y_label"), "right")
p.add_layout(LinearAxis(y_range_name="y"), "right")

scatter = Scatter(x="x", y="y", size=10)
p.add_glyph(source, scatter)

def add_title(text, loc, bg):
    lab = Title(text=text, background_fill_color=bg)
    p.add_layout(lab, loc)

add_title("Title A1", "above", "red")
add_title("Title A2", "above", "green")
add_title("Title A3", "above", "lightblue")
add_title("Title A4", "above", "pink")

add_title("Title B1", "below", "red")
add_title("Title B2", "below", "green")

add_title("Title L1", "left", "red")
add_title("Title L2", "left", "green")

add_title("Title R1", "right", "red")
add_title("Title R2", "right", "green")
add_title("Title R3", "right", "lightblue")
add_title("Title R4", "right", "pink")

show(p)
