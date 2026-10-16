''' A quiver plot of a vector field with interacting vortices and shear using decorated segments.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.arrow, bokeh.models.NormalHead, bokeh.transform.linear_cmap
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows, quiver, vector field

'''
import numpy as np

from bokeh.models import ColumnDataSource, HoverTool, NormalHead
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap

x, y = np.meshgrid(np.linspace(-2.95, 2.95, 33), np.linspace(-1.95, 1.95, 23))
x, y = x.ravel(), y.ravel()

# Superimpose localized vortices on a background drift and shear.
u = 0.15 + 0.12*y
v = 0.08*x
vortices = [
    (-1.6, 0.8, 0.8, 0.8),
    (-0.6, -0.9, -1.2, 1.0),
    (1.1, 0.6, 1.4, 1.1),
    (2.0, -1.0, -0.7, 0.6),
]
for cx, cy, strength, radius in vortices:
    dx, dy = x - cx, y - cy
    circulation = strength*np.exp(-(dx**2 + dy**2)/radius**2)
    u -= 2*dy*circulation/radius**2
    v += 2*dx*circulation/radius**2
speed = np.hypot(u, v)

# Keep the longest arrow slightly shorter than the grid spacing.
scale = 0.17/speed.max()
source = ColumnDataSource(dict(
    x=x, y=y, u=u, v=v, speed=speed,
    x_end=x + scale*u, y_end=y + scale*v,
    head_size=7*np.sqrt(speed/speed.max()),
))
# Keep the full magnitude color range visible against a dark plot area.
color = linear_cmap("speed", Turbo256, low=0, high=speed.max())

p = figure(width=900, height=620, match_aspect=True,
           x_range=(-3, 3), y_range=(-2, 2),
           title="Vortices in a sheared flow", background_fill_color="#202a36",
           x_axis_label="x", y_axis_label="y",
           tools="pan,wheel_zoom,reset", active_scroll="wheel_zoom")
p.grid.grid_line_color = "white"
p.grid.grid_line_alpha = 0.08

arrows = p.arrow(x_start="x", y_start="y", x_end="x_end", y_end="y_end",
                 source=source, line_color=color, line_width=1.5,
                 end=NormalHead(size="head_size", fill_color=color, line_color=color))
p.add_tools(HoverTool(renderers=[arrows], tooltips=[
    ("position", "(@x{0.0}, @y{0.0})"),
    ("vector", "(@u{0.0}, @v{0.0})"),
    ("magnitude", "@speed{0.00}"),
]))

show(p)
