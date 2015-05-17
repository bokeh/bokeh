from bokeh.plotting import figure, output_server, show
from bokeh.models import ServerDataSource

import bokeh.transforms.ar_downsample as ar
from blaze.server.client import Client
from blaze import Data

output_server("abstractrender")

c = Client('http://localhost:5006')
d = Data(c)
source = ServerDataSource()
source.from_blaze(d.gauss, local=True)

plot = figure()
plot.square('oneA', 'oneB', color='#FF00FF', source=source)


#Server-side colored heatmap
arplot = ar.heatmap(plot, spread=3, transform=None, title="Server-rendered, uncorrected")

arplot = ar.heatmap(plot, spread=3, transform="Log", title="Server-rendered, log transformed")
arplot =  ar.heatmap(plot, spread=3, title="Server-rendered, perceptually corrected")

ar.replot(plot,
          agg=ar.Count(),
          info=ar.Const(val=1),
          shader=ar.Spread(factor=3) + ar.Cuberoot() + ar.InterpolateColor(low=(255,200,200), high=(255,0,0)),
          points=True,
          title="Manually process: perceptually corrected",
          reserve_val=0)

# Client-side colored heatmap
# I think this has been broken for a while?
# ar.heatmap(plot, spread=3, client_color=True, palette="Reds9", title="Client-colored")

# Contours come in the same framework, but since the results of the shader are lines you use a different plotting function...
# colors = ["#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
# ar.contours(plot, palette=colors, title="ISO Contours")


# # Multiple categories
source = ServerDataSource()
source.from_blaze(d.gauss, local=True)

plot = figure()
plot.square('oneA', 'oneB', color='cats', source=source)
arplot = ar.hdalpha(plot, spread=5, title="Multiple categories")
show(plot)
