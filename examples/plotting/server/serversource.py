import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource 
output_server("remotedata")
source = ServerDataSource(data_url="/defaultuser/AAPL.hdf5", 
                          owner_username="defaultuser")
line('date', 'close',
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     source=source,
     legend='AAPL')
