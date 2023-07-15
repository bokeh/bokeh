from math import pi
from typing import Any, Literal

from bokeh.core.properties import expr, value
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Arc, Circle, ColumnDataSource, Plot,
                          PolarTransform, Range1d, Ray, Text)
from bokeh.util.browser import view

xdr = Range1d(start=-1.25, end=1.25)
ydr = Range1d(start=-1.25, end=1.25)

plot = Plot(x_range=xdr, y_range=ydr, width=600, height=600)
plot.toolbar_location = None
plot.outline_line_color = None

start_angle = pi + pi/4
end_angle = -pi/4

max_kmh = 250
max_mph = max_kmh*0.621371

major_step, minor_step = 25, 5

plot.add_glyph(Circle(x=0, y=0, radius=1.00, fill_color="white", line_color="black"))
plot.add_glyph(Circle(x=0, y=0, radius=0.05, fill_color="gray", line_color="black"))

plot.add_glyph(Text(x=0, y=+0.15, text=value("km/h"), text_color="red", text_align="center", text_baseline="bottom", text_font_style="bold"))
plot.add_glyph(Text(x=0, y=-0.15, text=value("mph"), text_color="blue", text_align="center", text_baseline="top", text_font_style="bold"))

def data(val: float):
    """Shorthand to override default units with "data", for e.g. `Ray.length`. """
    return value(val, units="data")

def speed_to_angle(speed: float, units: str) -> float:
    max_speed = max_kmh if units == "kmh" else max_mph
    speed = min(max(speed, 0), max_speed)
    total_angle = start_angle - end_angle
    angle = total_angle*float(speed)/max_speed
    return start_angle - angle

def add_needle(speed: float, units: str) -> None:
    angle = speed_to_angle(speed, units)
    plot.add_glyph(Ray(x=0, y=0, length=data(0.75), angle=angle,    line_color="black", line_width=3))
    plot.add_glyph(Ray(x=0, y=0, length=data(0.10), angle=angle-pi, line_color="black", line_width=3))

def add_gauge(radius: float, max_value: float, length: float, direction: Literal[-1, 1], color: Any, major_step: int, minor_step: int) -> None:
    major_angles, minor_angles = [], []

    total_angle = start_angle - end_angle

    major_angle_step = float(major_step)/max_value*total_angle
    minor_angle_step = float(minor_step)/max_value*total_angle

    major_angle = 0

    while major_angle <= total_angle:
        major_angles.append(start_angle - major_angle)
        major_angle += major_angle_step

    minor_angle = 0

    while minor_angle <= total_angle:
        minor_angles.append(start_angle - minor_angle)
        minor_angle += minor_angle_step

    major_labels = [ major_step*i for i, _ in enumerate(major_angles) ]

    n = major_step/minor_step
    minor_angles = [ x for i, x in enumerate(minor_angles) if i % n != 0 ]

    glyph = Arc(x=0, y=0, radius=radius, start_angle=start_angle, end_angle=end_angle, direction="clock", line_color=color, line_width=2)
    plot.add_glyph(glyph)

    rotation = 0 if direction == 1 else -pi

    angles = [ angle + rotation for angle in major_angles ]
    source = ColumnDataSource(dict(major_angles=major_angles, angle=angles))

    t = PolarTransform(radius=radius, angle="major_angles")
    glyph = Ray(x=expr(t.x), y=expr(t.y), length=data(length), angle="angle", line_color=color, line_width=2)
    plot.add_glyph(source, glyph)

    angles = [ angle + rotation for angle in minor_angles ]
    source = ColumnDataSource(dict(minor_angles=minor_angles, angle=angles))

    t = PolarTransform(radius=radius, angle="minor_angles")
    glyph = Ray(x=expr(t.x), y=expr(t.y), length=data(length/2), angle="angle", line_color=color, line_width=1)
    plot.add_glyph(source, glyph)

    text_angles = [ angle - pi/2 for angle in major_angles ]
    source = ColumnDataSource(dict(major_angles=major_angles, angle=text_angles, text=major_labels))

    t = PolarTransform(radius=radius + 2*length*direction, angle="major_angles")
    glyph = Text(x=expr(t.x), y=expr(t.y), angle="angle", text="text", text_align="center", text_baseline="middle")
    plot.add_glyph(source, glyph)

add_gauge(0.75, max_kmh, 0.05, +1, "red", major_step, minor_step)
add_gauge(0.70, max_mph, 0.05, -1, "blue", major_step, minor_step)

add_needle(55, "kmh")

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "gauges.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="Gauges"))
    print(f"Wrote {filename}")
    view(filename)
