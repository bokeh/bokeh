# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.models import ServerDataSource
from bokeh.transforms import image_downsample

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_server("remote_image")

source = image_downsample.source(expr={'op': 'Field', 'args': [':leaf', 'array']})
plot = figure(x_range=[0,10],
              y_range=[0,10],
)
plot.image(
    source=source,
    image="image",
    x="x",
    y="y",
    dw="dw",
    dh="dh",
    palette="Spectral11",
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"
)

show()
