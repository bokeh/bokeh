from __future__ import division

import numpy as np

from bokeh.plotting import figure, output_file, show

# create an array of RGBA data
N = 20
img = np.empty((N, N), dtype=np.uint32)
view = img.view(dtype=np.uint8).reshape((N, N, 4))
for i in range(N):
    for j in range(N):
        view[i, j, 0] = int(255 * i / N)
        view[i, j, 1] = 158
        view[i, j, 2] = int(255 * j / N)
        view[i, j, 3] = 255

output_file("image_rgba.html")

p = figure(plot_width=400, plot_height=400, x_range=(0, 10), y_range=(0, 10))

p.image_rgba(image=[img], x=[0], y=[0], dw=[10], dh=[10])

show(p)
