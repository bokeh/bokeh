""" This example demonstrates adding decorations and decoration patterns
    to various line and area glyphs.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_decoration, bokeh.plotting.figure.add_decoration_pattern
    :keywords: scatter, tools

"""

from math import pi

from bokeh.models import NormalHead, OpenHead, VeeHead
from bokeh.plotting import figure, show

p = figure()

arc = p.arc(
    x=60,
    y=30,
    radius=10,
    start_angle=[30, 120], start_angle_units="deg",
    end_angle=[90, 180], end_angle_units="deg",
    line_color="black",
)
arc.add_decoration(VeeHead(size=8), "start")
arc.add_decoration(VeeHead(size=8), "middle")
arc.add_decoration(VeeHead(size=8), "end")

seg = p.segment(x0=[20, 30], y0=[20, 20], x1=[40, 50], y1=[40, 40])
seg.add_decoration(VeeHead(size=8), 0.25)
seg.add_decoration(VeeHead(size=8), "start")
seg.add_decoration(VeeHead(size=8), "middle")
seg.add_decoration(VeeHead(size=8), 0.75)
seg.add_decoration(VeeHead(size=8), "end")

seg = p.segment(x0=[20, 30], y0=[0, 0], x1=[40, 50], y1=[20, 20])
#seg.add_decoration_pattern([VeeHead(size=8), 8, NormalHead(size=8)])

mline = p.multi_line(xs=[[40, 60, 80]], ys=[[0, 20, 10]])
mline.add_decoration(OpenHead(size=8), "start")
mline.add_decoration(VeeHead(size=8), "end")
#mline.add_decoration_pattern(Marker())

bezier = p.bezier(x0=[60], y0=[0], cx0=[60], cy0=[20], cx1=[80], cy1=[40], x1=[100], y1=[20])
bezier.add_decoration(VeeHead(size=8), "start")
#bezier.add_decoration(VeeHead(size=8), 0.25)
bezier.add_decoration(VeeHead(size=8), "middle")
#bezier.add_decoration(VeeHead(size=8), 0.75)
bezier.add_decoration(VeeHead(size=8), "end")

ray = p.ray(x=80, y=40, length=10, angle=-pi/3, color="purple")
ray.add_decoration(NormalHead(size=8), "middle")
ray.add_decoration(NormalHead(size=8), "start")
ray.add_decoration(NormalHead(size=8), "end")

show(p)
