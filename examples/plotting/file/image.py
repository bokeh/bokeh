''' A plot that demonstrates rendering images by colormapping scalar arrays.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.Figure.image
    :refs: :ref:`userguide_plotting` > :ref:`userguide_plotting_images`
    :keywords: image

'''
import numpy as np

from bokeh.plotting import figure, show

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

p = figure(tooltips=[("x", "$x"), ("y", "$y"), ("value", "@image")])
p.x_range.range_padding = p.y_range.range_padding = 0

# must give a vector of image data for image parameter
p.image(image=[d], x=0, y=0, dw=10, dh=10, palette="Spectral11", level="image")
p.grid.grid_line_width = 0.5

show(p)
