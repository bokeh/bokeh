from __future__ import print_function

from bokeh.util.browser import view
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    GMapPlot, Range1d, ColumnDataSource,
    PanTool, WheelZoomTool, GMapOptions)
from bokeh.resources import INLINE
from bokeh.sampledata.world_cities import data

x_range = Range1d(-160, 160)
y_range = Range1d(-80, 80)

map_options = GMapOptions(lat=15, lng=0, zoom=2)

plot = GMapPlot(
    x_range=x_range,
    y_range=y_range,
    plot_width=1000,
    plot_height=500,
    map_options=map_options,
    title="Cities of the world with a population over 5,000 people.",
    webgl=True,
)

circle = Circle(x="lng", y="lat", size=5, line_color=None, fill_color='firebrick', fill_alpha=0.2)
plot.add_glyph(ColumnDataSource(data), circle)
plot.add_tools(PanTool(), WheelZoomTool())

if __name__ == "__main__":
    filename = "maps_cities.html"
    with open(filename, "w") as f:
        f.write(file_html(plot, INLINE, "Google Maps - World cities Example"))
    print("Wrote %s" % filename)
    view(filename)
