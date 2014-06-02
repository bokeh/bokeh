import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d, ServerDataSource
"""
In order to run this example, you have to execute
./bokeh-server -D remotedata

the remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""

output_server("remote_image")
source = ServerDataSource(data_url="/defaultuser/array.table/image", 
                          owner_username="defaultuser",
                          data={'x': [0],
                                'y': [0],
                                'global_x_range' : [0, 10],
                                'global_y_range' : [0, 10],
                                'global_offset_x' : [0],
                                'global_offset_y' : [0],
                                'dw' : [10], 
                                'dh' : [10]
                            }
)

image_rgba(
    source=source,
    image="image",
    x="x",
    y="y",
    dw="dw",
    dh="dh",
    width=200,
    height=200,
    x_range=Range1d(start=0, end=10),
    y_range=Range1d(start=0, end=10),
    tools="pan,wheel_zoom,box_zoom,reset,previewsave"
)

show()
