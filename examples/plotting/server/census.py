import numpy as np
from bokeh.plotting import square, output_server, image, show
from bokeh.objects import ServerDataSource

import bokeh.transforms.ar_downsample as ar
#from bokeh.transforms import line_downsample


output_server("Census")
#2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/CensusTracts_backup.hdf5", owner_username="defaultuser")
plot = square( 'INTPTLONG','INTPTLAT',source=source)
heatmap = ar.source(plot, palette=["Reds-9"], points=True)
image(source=heatmap, title="Census Tracts", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))

source = ServerDataSource(data_url="/defaultuser/CensusTracts.hdf5", owner_username="defaultuser")
plot = square( 'LON','LAT',source=source)
heatmap = ar.source(plot, palette=["Reds-9"], points=True)
image(source=heatmap, title="Census Tracts", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))

source = ServerDataSource(data_url="/defaultuser/diag_pos_pos.hdf5", owner_username="defaultuser")
plot = square( 'x','y',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Positive", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))

source = ServerDataSource(data_url="/defaultuser/diag_neg_neg.hdf5", owner_username="defaultuser")
plot = square( 'x','y',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Negative", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))

source = ServerDataSource(data_url="/defaultuser/diag_neg_pos.hdf5", owner_username="defaultuser")
plot = square( 'x','y',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Negative/Positive", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))


source = ServerDataSource(data_url="/defaultuser/diag_span_pos.hdf5", owner_username="defaultuser")
plot = square( 'x','y',source=source)
heatmap = ar.source(plot, palette=["Reds-9"])
image(source=heatmap, title="Spanning/Negative", reserve_val=0, plot_width=600, plot_height=400, **ar.mapping(heatmap))


show()
