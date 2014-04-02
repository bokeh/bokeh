import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d, ServerDataSource

N = 1000

x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

output_server("remote_image")
source = ServerDataSource(data_url="/defaultuser/array.table/array", 
                          owner_username="defaultuser",
                          data={'x': [0], 
                                'y': [0],
                                'global_x_range' : [0, 10],
                                'global_y_range' : [0, 10],
                                'global_offset_x' : [0],
                                'global_offset_y' : [0],
                                'dw' : [10], 
                                'dh' : [10], 
                                'palette': ["Spectral-11"]
                            }
)

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
    x_range=Range1d(start=0, end=10), 
    y_range=Range1d(start=0, end=10),
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"
)

show()
