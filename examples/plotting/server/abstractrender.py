import numpy as np
from bokeh.plotting import square, output_server, image, show
from bokeh.objects import ServerDataSource

import bokeh.transforms.ar_downsample as ar
#from bokeh.transforms import line_downsample


output_server("abstractrender")
source = ServerDataSource(data_url="fn://gauss", owner_username="defaultuser")
plot = square('oneA', 'oneB', color='#FF00FF', source=source)


# Simple heat-map: bin the counts ('tis the default configuration....)
heatmap =ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Heatmap", reserve_val=0, **ar.mapping(heatmap))

#Perceptually corrected heat-map.  Cube-root then bin
percepmap = ar.source(plot, shader=ar.Cuberoot(), palette=["Reds-9"])
image(source=percepmap, title="Perceptually corrected", reserve_val=0, **ar.mapping(percepmap))


# Contours come in the same framework, but since the results of the shader are lines you use a different plotting function...
colors = ["#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
ar.replot(plot, title="ISO Contours", shader=ar.Contour(levels=len(colors)), line_color=colors)

#"""
#In order to run the 'stocks' example, you have to execute
#./bokeh-server -D remotedata
#
#The remote data directory in the bokeh checkout has the sample data for this example
#
#In addition, you must install ArrayManagement from this branch (soon to be master)
#https://github.com/ContinuumIO/ArrayManagement
#"""
#
##Stock-data plotting
#source = ServerDataSource(data_url="/defaultuser/AAPL.hdf5", owner_username="defaultuser")
#plot = square('volume','close',color='#FF00FF',source=source)
#percepmap = ar.source(plot, shader=ar.Cuberoot(), palette=["Reds-9"])
#image(source=percepmap, title="Perceptually corrected (Stocks)", reserve_val=0, **ar.mapping(percepmap))

show()
