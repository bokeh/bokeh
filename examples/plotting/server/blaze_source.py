# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.models import BlazeDataSource
from bokeh.transforms import line_downsample
from blaze.server.client import Client
from blaze import Data
output_server("blaze_source")
c = Client('http://localhost:5006')
d = Data(c)
source = BlazeDataSource()
source.from_blaze(d.gauss)
p = figure()
p.circle('oneA', 'oneB',
       color='#A6CEE3',
       tools="pan,wheel_zoom,box_zoom,reset,previewsave",
       source=source)
show(p)
