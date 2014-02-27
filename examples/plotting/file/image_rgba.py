
from __future__ import division

import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d

N = 20

img = np.empty((N,N), dtype=np.uint32)

view = img.view(dtype=np.uint8).reshape((N, N, 4))
for i in range(N):
    for j in range(N):
        view[i, j, 0] = int(i/N*255)
        view[i, j, 1] = 158
        view[i, j, 2] = int(j/N*255)
        view[i, j, 3] = 255

output_file("rgba_image.html", title="rgba_image.py example")

image_rgba(
    image=[img], x=[0], y=[0], dw=[10], dh=[10],
    x_range = Range1d(start=0, end=10), y_range = Range1d(start=0, end=10),
    tools="pan,wheel_zoom,box_zoom,reset,previewsave", name="image_example")

show()  # open a browser
