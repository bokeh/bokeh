
import numpy as np
from bokeh.transforms.line_downsample import downsample

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

import datetime as dt

output_cloud("downsampled")
dates = np.array(AAPL['date'], dtype=np.datetime64)
close = np.array(AAPL['adj_close'])

line(dates, close,
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     legend='AAPL')
result = downsample(dates, close.reshape(-1,1), 
                    [dates.min(), dates.max()],
                    [close.min(), close.max()],
                    np.timedelta64(dt.timedelta(days=30))
                    )
dates, close = result[0]
line(dates, close,
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     legend='AAPL')

