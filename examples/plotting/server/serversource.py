# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.models import ServerDataSource, BlazeDataSource
from bokeh.transforms import line_downsample

output_server("remotedata")
source = BlazeDataSource(data_url="http://localhost:5006/compute.json",
                         expr={'op': 'Field', 'args': [':leaf', 'aapl']})
p = figure(x_axis_type = "datetime")
p.line('date', 'close',
       color='#A6CEE3',
       tools="pan,wheel_zoom,box_zoom,reset,previewsave",
       source=source,
       legend='AAPL')
show()
