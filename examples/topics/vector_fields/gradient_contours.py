''' Overlay gradient arrows on contours to show the direction of steepest ascent.

.. bokeh-example-metadata::
    :title: Follow the gradient uphill
    :keywords: gradient, vector field, contours, scalar field, steepest ascent
    :apis: bokeh.plotting.figure.contour, bokeh.plotting.figure.arrow, bokeh.models.NormalHead
    :gallery: Dark arrows point uphill across pale blue contour bands around two peaks.

'''
import numpy as np

from bokeh.models import ColumnDataSource, HoverTool, NormalHead
from bokeh.palettes import Blues256
from bokeh.plotting import figure, show

x = np.linspace(-3, 3, 161)
y = np.linspace(-2.2, 2.2, 121)
xx, yy = np.meshgrid(x, y)
z = (np.exp(-((xx + 1)**2/1.8 + (yy - 0.5)**2/1.0))
     + 0.8*np.exp(-((xx - 1.3)**2/0.7 + (yy + 0.7)**2/1.4)))

dy, dx = np.gradient(z, y, x)

indices = np.s_[5:-5:9, 5:-5:9]
ax, ay, u, v = [array[indices].ravel() for array in (xx, yy, dx, dy)]
slope = np.hypot(u, v)
visible = slope > 0.035
ax, ay, u, v, slope = [array[visible] for array in (ax, ay, u, v, slope)]
scale = 0.32/slope.max()

source = ColumnDataSource(dict(x=ax, y=ay, u=u, v=v, slope=slope,
                               x_end=ax + scale*u, y_end=ay + scale*v))

p = figure(width=900, height=620, x_range=(-3, 3), y_range=(-2.2, 2.2), match_aspect=True,
           title="Gradients point uphill, perpendicular to contours", tools="pan,wheel_zoom,reset",
           x_axis_label="x", y_axis_label="y")
p.grids.visible = False

contours = p.contour(x, y, z, levels=np.linspace(0, 1.2, 10),
                     fill_color=list(reversed(Blues256[115::17])), line_color="#7393aa", line_alpha=0.5)
p.add_layout(contours.construct_color_bar(title="Synthetic height"), "right")

arrows = p.arrow(x_start="x", y_start="y", x_end="x_end", y_end="y_end", source=source, level="glyph",
                 line_color="#25323f", line_width=2,
                 end=NormalHead(size=6, fill_color="#25323f", line_color=None))

p.add_tools(HoverTool(renderers=[arrows], tooltips=[
    ("position", "(@x{0.00}, @y{0.00})"), ("gradient", "(@u{0.00}, @v{0.00})"),
    ("slope", "@slope{0.00}"),
]))

show(p)
