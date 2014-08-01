# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource
from bokeh.transforms import image_downsample
"""
In order to run this example, you have to execute
./bokeh-server -D remotedata

the remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_server("remote_image")
source = image_downsample.source(data_url="/defaultuser/array.table/array",
                                 owner_username="defaultuser")

image(
    source=source,
    image="image",
    x="x",
    y="y",
    dw="dw",
    dh="dh",
    width=200,
    height=200,
    palette="palette",
    x_range=[0,10],
    y_range=[0,10],
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"
)

show()
