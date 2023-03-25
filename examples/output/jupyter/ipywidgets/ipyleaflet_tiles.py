from ipyleaflet import Map
from ipywidgets_bokeh import IPyWidget

from bokeh.layouts import row
from bokeh.models import WMTSTileSource
from bokeh.plotting import curdoc, figure

center = [51.1079, 17.0385]
zoom = 7

map = Map(center=center, zoom=zoom)
map_wrapper = IPyWidget(widget=map, width=600, height=400)

url = "http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
attribution = "Map data (c) <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
tile_source = WMTSTileSource(url=url, attribution=attribution)

plot = figure(
    x_range=(1551600, 2212000), y_range=(6417000, 6872000),
    x_axis_type=None, y_axis_type=None,
    width=600, height=400,
)
plot.add_tile(tile_source)

doc = curdoc()
doc.add_root(row(map_wrapper, plot))
