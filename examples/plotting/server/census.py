from bokeh.plotting import figure, output_server, show
from bokeh.models import ServerDataSource
import bokeh.transforms.ar_downsample as ar
from blaze.server.client import Client
from blaze import Data
output_server("Census")
# 2010 US Census tracts

c = Client('http://localhost:5006')
d = Data(c)
source = ServerDataSource()
source.from_blaze(d.census, local=True)

plot = figure()
arplot = plot.square(
            'LON', 'LAT',
            source=source,
            plot_width=600,
            plot_height=400,
            title="Census Tracts")

ar.heatmap(arplot, palette="Reds9", reserve_val=0, points=True, client_color=True, title="Census Tracts (Client Colors)")
ar.heatmap(arplot, low=(255, 200, 200), points=True, title="Census Tracts (Server Colors)")
ar.contours(arplot, title="ISO Contours")
show(plot)
