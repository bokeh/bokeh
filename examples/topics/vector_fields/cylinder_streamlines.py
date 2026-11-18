''' Trace streamlines around a cylinder and color each segment by local flow speed.

.. bokeh-example-metadata::
    :title: Flow around a cylinder
    :keywords: streamlines, vector field, potential flow, cylinder, color mapping
    :apis: bokeh.plotting.figure.multi_line, bokeh.models.GlyphRenderer.add_path_marking, bokeh.models.HoverTool
    :gallery: Teal and yellow streamlines bend around a circular cylinder, with arrowheads showing left-to-right flow.

'''
import contourpy
import numpy as np

from bokeh.core.properties import field
from bokeh.models import ColumnDataSource, HoverTool, LinearColorMapper, NormalHead
from bokeh.palettes import Viridis256
from bokeh.plotting import figure, show
from bokeh.transform import transform

x = np.linspace(-3.5, 3.5, 501)
y = np.linspace(-2.4, 2.4, 351)
xx, yy = np.meshgrid(x, y)
r2 = xx**2 + yy**2

# Constant streamfunction contours are paths through this ideal, inviscid flow.
psi = np.ma.array(yy*(1 - 1/np.maximum(r2, 1e-9)), mask=r2 <= 1.01)
contours = contourpy.contour_generator(x=x, y=y, z=psi)


def velocity(x, y):
    r4 = (x*x + y*y)**2
    return 1 - (x*x - y*y)/r4, -2*x*y/r4


xs, ys, speeds = [], [], []
paths = dict(xs=[], ys=[], positions=[])

for index, level in enumerate(np.r_[-np.linspace(0.08, 2, 13), np.linspace(0.08, 2, 13)]):
    for path in contours.lines(level):
        if path[0, 0] > path[-1, 0]:
            path = path[::-1]

        for i in range(0, len(path) - 1, 8):
            segment = path[i:i + 9]
            mx, my = segment.mean(axis=0)
            u, v = velocity(mx, my)
            xs.append(segment[:, 0])
            ys.append(segment[:, 1])
            speeds.append(np.hypot(u, v))

        # Path markings use arc-length fractions. Stagger them between streamlines.
        phase = 0.05 + (index*0.618 % 1)*0.2
        positions = np.arange(phase, 0.98, 0.23)
        paths["xs"].append(path[:, 0])
        paths["ys"].append(path[:, 1])
        paths["positions"].append(positions.tolist())

mapper = LinearColorMapper(palette=Viridis256[65:], low=0, high=2)
source = ColumnDataSource(dict(xs=xs, ys=ys, speed=speeds))

# Match the frame aspect ratio to the fixed data ranges so the cylinder is circular.
p = figure(frame_width=700, frame_height=480, x_range=(-3.5, 3.5), y_range=(-2.4, 2.4),
           match_aspect=True, title="Ideal flow around a cylinder", tools="pan,wheel_zoom,reset",
           x_axis_label="x / cylinder radius", y_axis_label="y / cylinder radius")
p.background_fill_color = "#172330"
p.grid.visible = False

lines = p.multi_line("xs", "ys", source=source, line_width=2.5,
                     line_color=transform("speed", mapper))
directions = p.multi_line("xs", "ys", source=ColumnDataSource(paths), line_alpha=0)
directions.add_path_marking(
    NormalHead(size=6, fill_color="#d8eee8", fill_alpha=1, line_color=None),
    at=field("positions"),
)
p.ellipse(x=0, y=0, width=2, height=2, fill_color="#dbe5ef", line_color="white", line_width=2)

p.add_layout(lines.construct_color_bar(title="Speed / upstream speed"), "right")
p.add_tools(HoverTool(renderers=[lines], tooltips=[("relative speed", "@speed{0.00}")], line_policy="interp"))

show(p)
