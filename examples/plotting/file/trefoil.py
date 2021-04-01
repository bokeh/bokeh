from math import cos, radians, sin

from bokeh.core.properties import value
from bokeh.io import show
from bokeh.models import TeeHead, Title, VeeHead
from bokeh.plotting import figure

deg = lambda value: dict(value=value, units="deg")
cdot = "\u22c5"
degree = "\u00b0"

# https://www.orau.org/ptp/articlesstories/radwarnsymbstory.htm
def trefoil(R=1):
    p = figure(
        x_range=(-6*R, 6*R), y_range=(-6*R, 6*R),
        frame_width=500, frame_height=500,
        background_fill_color="yellow",
        title=Title(text="Radiation Warning Symbol (Trefoil)", align="center", text_font_size="20px"),
        x_axis_type=None, y_axis_type=None,
        toolbar_location=None)

    p.annular_wedge(
        x=0, y=0,
        inner_radius=1.5*R, outer_radius=5*R,
        start_angle=[0, 120, 240], end_angle=[60, 180, 300],
        start_angle_units="deg", end_angle_units="deg",
        line_color="black", fill_color="magenta",
    )
    p.circle(
        x=0, y=0,
        radius=R,
        line_color="black", fill_color="magenta",
    )

    #arc = p.arc(x=0, y=0, radius=5.3*R, start_angle=deg(60), end_angle=deg(180), line_color="black")
    arc = p.arc(x=0, y=0, radius=5.3*R, start_angle=[60, 120], end_angle=[120, 180],
        start_angle_units="deg", end_angle_units="deg", line_color="black")
    #"|<", ">|<", ">|"
    arc.add_decoration(TeeHead(size=10), "start")
    arc.add_decoration(VeeHead(size=8), "start")
    arc.add_decoration(TeeHead(size=10), "end")
    arc.add_decoration(VeeHead(size=8), "end")
    #arc.add_decoration([VeeHead(), TeeHead(), VeeHead(reversed=True)], "middle")

    x1, y1 = 5.5*R*cos(radians(150)), 5.5*R*sin(radians(150))
    p.text(x=[0, x1], y=[5.3*R, y1], text=value(f"60{degree}"), text_baseline="bottom", text_align="center")

    #p.segment(x0=0, y0=0, x1=0, y1=-4*R, line_color="black", line_dash=value([1, 0, 1]))
    #p.segment(x0=R, y0=0, x1=R, y1=-2*R, line_color="black", line_dash=value([1, 0, 1]))
    #p.segment(x0=1.5*R, y0=0, x1=1.5*R, y1=-3*R, line_color="black", line_dash=value([1, 0, 1]))
    #p.segment(x0=5*R, y0=0, x1=5*R, y1=-4*R, line_color="black", line_dash=value([1, 0, 1]))

    p.segment(x0=[0, R, 1.5*R, 5*R], y0=0, x1=[0, R, 1.5*R, 5*R], y1=[-4*R, -2*R, -3*R, -4*R],
        line_color="black", line_dash=value([3, 3]))

    s = p.segment(x0=0, y0=[-2*R, -3*R, -4*R], x1=[R, 1.5*R, 5*R], y1=[-2*R, -3*R, -4*R], line_color="black")
    s.add_decoration(TeeHead(size=10), "start")
    s.add_decoration(VeeHead(size=8), "start")
    s.add_decoration(TeeHead(size=10), "end")
    s.add_decoration(VeeHead(size=8), "end")

    #p.line(x=[0, 0], y=[0, -4*R], line_color="black", line_dash=[1, 0, 1])
    #p.line(x=[R, R], y=[0, -2*R], line_color="black", line_dash=[1, 0, 1])
    #p.line(x=[1.5*R, 1.5*R], y=[0, -3*R], line_color="black", line_dash=[1, 0, 1])
    #p.line(x=[5*R, 5*R], y=[0, -4*R], line_color="black", line_dash=[1, 0, 1])

    #l0 = p.line(x=[0, R], y=[-2*R, -2*R], line_color="black")
    #l0.add_decoration(VeeHead(), "start")
    #l0.add_decoration(VeeHead(), "end")

    #l1 = p.line(x=[0, 1.5*R], y=[-3*R, -3*R], line_color="black")
    #l1.add_decoration(VeeHead(), "start")
    #l1.add_decoration(VeeHead(), "end")

    #l2 = p.line(x=[0, 5*R], y=[-4*R, -4*R], line_color="black")
    #l2.add_decoration(VeeHead(), "start")
    #l2.add_decoration(VeeHead(), "end")

    p.text(x=0.5*R, y=-2*R, text=value("R"), text_baseline="bottom", text_align="center")
    p.text(x=0.5*1.5*R, y=-3*R, text=value(f"1.5{cdot}R"), text_baseline="bottom", text_align="center")
    p.text(x=0.5*5*R, y=-4*R, text=value(f"5{cdot}R"), text_baseline="bottom", text_align="center")

    return p

show(trefoil())
