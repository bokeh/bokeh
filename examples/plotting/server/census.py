import numpy as np
from bokeh.plotting import square, output_server, image, show
from bokeh.objects import ServerDataSource

import bokeh.transforms.ar_downsample as ar
#from bokeh.transforms import line_downsample


output_server("abstractrender")
#2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/CensusTracts.hdf5", owner_username="defaultuser")
plot = square( 'INTPTLONG','INTPTLAT',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Census Tracts", reserve_val=0, **ar.mapping(heatmap))

show()


