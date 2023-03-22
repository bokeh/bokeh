''' An example demonstrating how to add alpha value (transparency) to images in different ways.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.plotting.figure.image, bokeh.layouts.Column
    :refs: :ref:`ug_topics_images`
    :keywords: image, alpha, line
'''

import numpy as np

from bokeh.layouts import Column
from bokeh.plotting import figure, show

# 1. Adding alpha for the image method

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)
d[:125, :125] = np.nan  # Set bottom left quadrant to NaNs

p1 = figure(x_range=(0, 10), y_range=(0, 10))

# Solid line to show effect of alpha
p1.line([0, 10], [0, 10], color='red', line_width=2)
# Use alpha kwarg to set alpha value
img = p1.image(image=[d], x=0, y=0, dw=10, dh=10, palette="Sunset11", alpha=0.7)
# Alpha for color mapper attributes can be set explicitly and is applied prior
# to the global alpha, e.g. NaN color:
img.glyph.color_mapper.nan_color = (128, 128, 128, 0.1)

# 2. Adding alpha for the image_rgba method

N = 20
img = np.empty((N, N), dtype=np.uint32)
view = img.view(dtype=np.uint8).reshape((N, N, 4))
c = 0
for i in range(N):
    for j in range(N):
        view[i, j, 0] = int(i/N*255)
        view[i, j, 1] = 158
        view[i, j, 2] = int(j/N*255)
        view[i, j, 3] = 127*(c % 3)  # Alpha rotates 0, 0.5, 1, 0, 0.5...
        c += 1

p2 = figure(x_range=(0, 10), y_range=(0, 10))

# Solid line to show effect of alpha
p2.line([0, 10], [10, 0], color='red', line_width=2)
# Use alpha kwarg to set alpha value to 0.5: alpha now 0, 0.25, 0.5, 0, 0.25...
p2.image_rgba(image=[img], x=0, y=0, dw=10, dh=10, alpha=0.5)

# 3. Adding alpha for the image_url method

url = 'https://static.bokeh.org/logos/logo.png'

p3 = figure(x_range=(0, 10), y_range=(0, 10))
# Solid line to show effect of alpha
p3.line([5, 5], [0, 10], color='red', line_width=2)
# Use alpha kwarg to set alpha value
p3.image_url(url=[url], x=0, y=0, w=10, h=10, anchor='bottom_left', alpha=0.3)

# Display images

show(Column(p1, p2, p3))
