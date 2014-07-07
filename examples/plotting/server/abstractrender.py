import numpy as np
from bokeh.plotting import square, output_server, image, show
from bokeh.objects import ServerDataSource

import bokeh.transforms.ar_downsample as ar
#from bokeh.transforms import line_downsample


output_server("abstractrender")
#source = ServerDataSource(data_url="fn://uniform", owner_username="defaultuser")
#plot = square('oneA','oneB',color='#FF00FF',source=source)


# Simple heat-map: bin the counts ('tis the default configuration....)
#heatmap =ar.source(plot, palette=["Reds-9"])
#image(source=heatmap, title="Heatmap", reserve_val=0, **ar.mapping(heatmap))
#image(source=heatmap, reserve_val=0, reserve_color=0xaaaaaa, **ar.mapping(heatmap))

###Perceptually corrected heat-map.  Cube-root then bin
#percepmap = ar.source(plot, shader=ar.Cuberoot(), palette=["Reds-9"])
#image(source=percepmap, title="Perceptually corrected", reserve_val=0, **ar.mapping(percepmap))


### Contours come in the same framework, but since the results of the shader are lines you use a different plotting function...
#contour = ar.source(glyphs=plot, agg=ar.Count(), info=ar.Const(1), shader=ar.Contour(9))
#multi_line(source=countour, palette=["reds-9"])
#
#
##Alternative: aggregator as an incomplete resampler
#aggregator = ar.source(ar.count(), ar.const(1), ar.touches())  ### Aggregator is incomplete without shader and glyphs.  Can add either to it
#shader = ar.Cuberoot()+ar.Interpolate(0,9) + ar.Floor()
#image(source=plot+aggregator+shader, palette=["reds-9"])   ###Implement aggregator.__radd__ to get a plot and .__add__ to get a shader


"""
In order to run the 'stocks' example, you have to execute
./bokeh-server -D remotedata

The remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""

#Stock-data plotting
#source = ServerDataSource(data_url="/defaultuser/AAPL.hdf5", owner_username="defaultuser")
#plot = square('volume','close',color='#FF00FF',source=source)
#percepmap = ar.source(plot, shader=ar.Cuberoot(), palette=["Reds-9"])
#image(source=percepmap, title="Perceptually corrected (Stocks)", reserve_val=0, **ar.mapping(percepmap))

#2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/CensusTracts.hdf5", owner_username="defaultuser")
plot = square( 'INTPTLONG','INTPTLAT',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Census Tracts", reserve_val=0, **ar.mapping(heatmap))

show()


