# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from bokeh.plotting import figure, show, output_server
from bokeh.models import BlazeDataSource
from blaze.server.client import Client
from blaze import Data
output_server("blaze_source")
c = Client('http://localhost:5006')
d = Data(c)
source = BlazeDataSource()
source.from_blaze(d.gauss)
p = figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave")
p.circle('oneA', 'oneB', color='#A6CEE3', source=source)
show(p)
