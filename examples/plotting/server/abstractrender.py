import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource
import bokeh.transforms.ar_downsample as ar

"""
In order to run this example, you have to execute
./bokeh-server -D remotedata

the remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""
output_server("Abstract rendering")
source = ServerDataSource(data_url="/defaultuser/AAPL.hdf5", owner_username="defaultuser")


plot = square('date','close',color='#FF00FF',source=source)

# Simple heat-map: bin the counts
heatmap = ar.Resample(glyphs=plot, transfer=ar.Interpolate(0,9))  #Temporary...until we work out chaining...
#heatmap = ar.Resample(glyphs=plot, agg=ar.Count(), info=ar.Const(1), select=ar.Touches(), transfer=ar.Interpolate(0,9)+ar.Floor())
#heatmap = ar.Resample(glyphs=plot, transfer=ar.Interpolate(0,9) + ar.Floor())
#heatmap = ar.Resample(glyphs=plot) + ar.Interpolate(0,9) + ar.Floor()
image(source=heatmap, image="image", x='x', y='y', dw='dw', dh='dh', palette=["reds-9"])
#
#
###Perceptually corrected heat-map.  Cube-root then bin
#percepmap = ar.Resample(glyphs=plot, agg=ar.count(), info=ar.const(1), select=ar.touches(), transfer=ar.Cuberoot()+ar.Interpolate(0,9)+ar.Floor())
#percepmap = ar.Resample(glyphs=plot) + ar.Cuberoot() + ar.Interpolate(0,9) + ar.Floor()
#image(source=percepmap, palette=["reds-9"])
#
#
### Contours come in the same framework, but since the results of the transfer are lines you use a different plotting function... 
#contour = ar.Resample(glyphs=plot, agg=ar.Count(), info=ar.Const(1), select=ar.touches(), transfer=ar.Contour(9))
#contour = ar.Resample(glyphs=plot) + transfer=ar.Contour(9))
#multi_line(source=countour, palette=["reds-9"])
#
#
##Alternative: aggregator as an incomplete resampler
#aggregator = ar.Resample(ar.count(), ar.const(1), ar.touches())  ### Aggregator is incomplete without transfer and glyphs.  Can add either to it
#transfer = ar.Cuberoot()+ar.Interpolate(0,9) + ar.Floor()
#image(source=plot+aggregator+transfer, palette=["reds-9"])   ###Implement aggregator.__radd__ to get a plot and .__add__ to get a transfer

