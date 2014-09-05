import numpy as np
from bokeh.plotting import square, output_server, image, show
from bokeh.objects import ServerDataSource

import bokeh.transforms.ar_downsample as ar
#from bokeh.transforms import line_downsample

output_server("abstractrender")
source = ServerDataSource(data_url="fn://gauss", owner_username="defaultuser")
plot = square('oneA', 'oneB', color='#FF00FF', source=source)


#Server-side colored heatmap
ar.heatmap(plot, spread=3, transform=None, title="Server-rendered, uncorrected")
ar.heatmap(plot, spread=3, transform="Log", title="Server-rendered, log transformed")
ar.heatmap(plot, spread=3, title="Server-rendered, perceptually corrected")

ar.replot(plot, 
          agg=ar.Count(), 
          shader=ar.Spread(factor=3) + ar.Cuberoot() + ar.InterpolateColor(low=(255,200,200), high=(255,0,0)),
          points=True,
          title="Manually process: perceptually corrected", 
          reserve_val=0)

# Client-side colored heatmap
ar.heatmap(plot, spread=3, client_color=True, palette=["Reds-9"], title="Client-colored")

# Contours come in the same framework, but since the results of the shader are lines you use a different plotting function...
colors = ["#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
ar.contours(plot, palette=colors, title="ISO Contours")



# Multiple categories
plot = square('oneA', 'oneB', color='cats', source=source)
ar.hdalpha(plot, spread=5, title="Multiple categories")


show()
