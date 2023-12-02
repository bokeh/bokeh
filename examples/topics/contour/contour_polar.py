''' Contour plot with polar grid and many visual properties.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.contour, bokeh.models.ContourRenderer.contruct_color_bar
    :refs: :ref:`ug_topics_contour_polar`
    :keywords: contour

'''
import numpy as np

from bokeh.palettes import Cividis
from bokeh.plotting import figure, show

# Data to contour is a 2D sin wave on a polar grid.
radius, angle = np.meshgrid(np.linspace(0, 1, 20), np.linspace(0, 2*np.pi, 120))
x = radius*np.cos(angle)
y = radius*np.sin(angle)
z = 1 + np.sin(3*angle)*np.sin(np.pi*radius)

p = figure(width=550, height=400)

levels = np.linspace(0, 2, 11)

contour_renderer = p.contour(
    x=x, y=y, z=z, levels=levels,
    fill_color=Cividis,
    hatch_pattern=["x"]*5 + [" "]*5,
    hatch_color="white",
    hatch_alpha=0.5,
    line_color=["white"]*5 + ["black"] + ["red"]*5,
    line_dash=["solid"]*6 + ["dashed"]*5,
    line_width=[1]*6 + [2]*5,
)

colorbar = contour_renderer.construct_color_bar(title="Colorbar title")
p.add_layout(colorbar, "right")

show(p)
