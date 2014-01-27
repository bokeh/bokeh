
import numpy as np
from bokeh.plotting import *

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_file("image.html", title="scatter.py example")

image(
    image=[d.flatten()], width=[N], height=[N], x=[0], y=[0], dw=[10], dh=[10], palette=["Spectral-11"],
    tools="pan,wheel_zoom,resize", name="image_example")

show()  # open a browser
