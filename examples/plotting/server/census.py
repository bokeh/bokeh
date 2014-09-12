from bokeh.plotting import square, output_server, show
from bokeh.objects import ServerDataSource
import bokeh.transforms.ar_downsample as ar

"""
In order to run this example, you have to execute
./bokeh-server -D remotedata

the remote data directory in the bokeh checkout has the sample data for this example

In addition, you must install ArrayManagement from this branch (soon to be master)
https://github.com/ContinuumIO/ArrayManagement
"""

output_server("Census")
# 2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/CensusTracts.hdf5", owner_username="defaultuser")
plot = square(
        'LON', 'LAT',
        source=source,
        plot_width=600,
        plot_height=400,
        title="Census Tracts")

ar.heatmap(plot, palette=["Reds-9"], reserve_val=0, points=True, client_color=True, title="Census Tracts (Client Colors)")
ar.heatmap(plot, low=(255, 200, 200), points=True, title="Census Tracts (Server Colors)")
ar.contours(plot, title="ISO Contours")
show()
