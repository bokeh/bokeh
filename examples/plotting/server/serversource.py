# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from bokeh.plotting import figure, show, output_server
from bokeh.transforms import line_downsample
from blaze.server.client import Client
from blaze import Data

output_server("remotedata")

c = Client('http://localhost:5006')
d = Data(c)
table = d.aapl
source = line_downsample.source()
source.from_blaze(table, local=True)

p = figure(x_axis_type = "datetime")
p.line('date', 'close',
       color='#A6CEE3',
       tools="pan,wheel_zoom,box_zoom,reset,previewsave",
       source=source,
       legend='AAPL')
show(p)
