
import numpy as np
from bokeh.transforms.line_downsample import downsample

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

import datetime as dt

output_server("default")
dates = np.array(AAPL['date'], dtype=np.datetime64)
close = np.array(AAPL['adj_close'])
open = np.array(AAPL['open'])
data = np.empty((len(close),),
                dtype=[('date', 'datetime64[D]'), 
                       ('close', 'float64'), 
                       ('open', 'float64')]
                )

data['date'] = dates
data['close'] = close
data['open'] = open


line(dates, close,
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     legend='AAPL')
data = downsample(data, 'date', 'close',
                  [dates.min(), dates.max()],
                  100,
                  )
line(data['date'], data['close'],
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     legend='AAPL')

