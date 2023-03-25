''' Simple contour plot showing both contour lines and filled polygons.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.contour, bokeh.models.ContourRenderer.contruct_color_bar
    :refs: :ref:`ug_topics_contour_simple`
    :keywords: contour

'''
import numpy as np

from bokeh.palettes import Sunset8
from bokeh.plotting import figure, show

# Data to contour is the sum of two Gaussian functions.
x, y = np.meshgrid(np.linspace(0, 3, 40), np.linspace(0, 2, 30))
z = 1.3*np.exp(-2.5*((x-1.3)**2 + (y-0.8)**2)) - 1.2*np.exp(-2*((x-1.8)**2 + (y-1.3)**2))

p = figure(width=550, height=300, x_range=(0, 3), y_range=(0, 2))

levels = np.linspace(-1, 1, 9)
contour_renderer = p.contour(x, y, z, levels, fill_color=Sunset8, line_color="black")

colorbar = contour_renderer.construct_color_bar()
p.add_layout(colorbar, "right")

show(p)
