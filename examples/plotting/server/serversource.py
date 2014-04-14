import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource
"""
In order to run this example, you have to execute
./bokeh-server -D remotedata

the remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""
output_server("remotedata")
source = ServerDataSource(data_url="/defaultuser/AAPL.hdf5", 
                          owner_username="defaultuser")
line('date', 'close',
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     source=source,
     legend='AAPL')
