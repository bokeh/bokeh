from bokeh.plotting import square, output_server, show
from bokeh.objects import ServerDataSource
import bokeh.transforms.ar_downsample as ar

output_server("Census")
# 2010 US Census tracts
source = ServerDataSource(data_url="/defaultuser/CensusTracts.hdf5", owner_username="defaultuser")
plot = square(
        'LON', 'LAT',
        source=source,
        plot_width=600,
        plot_height=400,
        title="Census Tracts")

ar.replot(plot, palette=["Reds-9"], reserve_val=0, points=True)

ar.replot(plot,
        shader=ar.Cuberoot() + ar.InterpolateColor(low=(255, 200, 200)),
        points=True,
        title="Census Tracts (Server Colors)")

colors = ["#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
ar.replot(plot, shader=ar.Cuberoot() + ar.Spread(factor=2) + ar.Contour(levels=len(colors)), line_color=colors, points=True, title="Census (Contours)")

show()
