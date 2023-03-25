''' A plot that demonstrates rendering images by colormapping scalar arrays.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.image
    :refs: :ref:`ug_topics_images`
    :keywords: image

'''
import numpy as np

from bokeh.plotting import figure, show

x = np.linspace(0, 10, 300)
y = np.linspace(0, 10, 300)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx) * np.cos(yy)

p = figure(width=400, height=400)
p.x_range.range_padding = p.y_range.range_padding = 0

# must give a vector of image data for image parameter
p.image(image=[d], x=0, y=0, dw=10, dh=10, palette="Sunset11", level="image")
p.grid.grid_line_width = 0.5

show(p)
