
import numpy as np
from bokeh.transforms.line_downsample import downsample

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

import datetime as dt

output_server("remote data")
source = RemoteDataSource(data_url="/defaultuser/AAPL.hdf5", 
                          owner_username="defaultuser")

dates = np.array(AAPL['date'], dtype=np.datetime64)
close = np.array(AAPL['adj_close'])
line(dates, close,
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     legend='AAPL')

line('date', 'close',
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     source=source,
     legend='AAPL')
