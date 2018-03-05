import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.layouts import Column

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
img = p1.image(image=[d], x=0, y=0, dw=10, dh=10, palette="Spectral11", alpha=0.7)
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
# Use alpha kwarg to set alpha value. Alpha now 0, 0.25, 0.5, 0, 0.25...
p2.image_rgba(image=[img], x=0, y=0, dw=10, dh=10, alpha=0.5)

output_file("image_alpha.html", title="image_alpha.py example")

show(Column(p1, p2))  # open a browser
