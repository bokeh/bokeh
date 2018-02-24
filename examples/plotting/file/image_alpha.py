import numpy as np

from bokeh.plotting import figure, show, output_file

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)
d[:125, :125] = np.nan  # Set bottom left quadrant to NaNs

p = figure(x_range=(0, 10), y_range=(0, 10))

# Solid line to show effect of alpha
p.line([0, 10], [0, 10], color='red', line_width=2)
# Use global_alpha kwarg to set alpha value
img = p.image(image=[d], x=0, y=0, dw=10, dh=10, global_alpha=0.7)
# NaN color alpha can be set separately
img.glyph.color_mapper.nan_color = (128, 128, 128, 0.1)

output_file("image_alpha.html", title="image_alpha.py example")

show(p)  # open a browser
