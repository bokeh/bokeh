import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource
from bokeh.transforms import ar_downsample

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
heatmap = ar.resample(glyphs=plot, agg=ar.count(), info=ar.const(1), select=ar.touches(), transfer=ar.bin(9))
image(source=resample, pallette=["reds-9"])


##Perceptually corrected heat-map.  Cube-root then bin
percepmap = ar.resample(glyphs=plot, agg=ar.count(), info=ar.const(1), select=ar.touches(), transfer=ar.cuberoot()+ar.bin(9))
image(source=percepmap, pallette=["reds-9"])


## Contours come in the same framework, but since the results of the transfer are lines you use a different plotting function... 
contour = ar.resample(glyphs=plot, agg=ar.count(), info=ar.const(1), select=ar.touches(), transfer=ar.contour(9))
multi_line(source=countour, pallette=["reds-9"])


#Alternative: aggregator as an incomplete resampler
aggregator = ar.aggregator(ar.count(), ar.const(1), ar.touches())  ### Aggregator is incomplete without transfer and glyphs.  Can add either to it
transfer = ar.cuberoot()+ar.bin(9)  ### concatenate transfers together...
image(source=plot+aggregator+transfer, pallette=["reds-9"])   ###Implement aggregator.__radd__ to get a plot and .__add__ to get a transfer

