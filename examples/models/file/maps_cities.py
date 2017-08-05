from __future__ import print_function

from bokeh.document import Document
from bokeh.util.browser import view
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    GMapPlot, Range1d, ColumnDataSource,
    PanTool, WheelZoomTool, GMapOptions, Label)
from bokeh.resources import INLINE
from bokeh.sampledata.world_cities import data

x_range = Range1d(-160, 160)
y_range = Range1d(-80, 80)

# Google Maps now requires an API key. You can find out how to get one here:
# https://developers.google.com/maps/documentation/javascript/get-api-key
API_KEY = "GOOGLE_API_KEY"

map_options = GMapOptions(lat=15, lng=0, zoom=2)

plot = GMapPlot(
    x_range=x_range,
    y_range=y_range,
    plot_width=1000,
    plot_height=500,
    map_options=map_options,
    api_key=API_KEY,
    output_backend="webgl",
)

if plot.api_key == "GOOGLE_API_KEY":
    plot.add_layout(Label(x=500, y=320, x_units='screen', y_units='screen',
                          text='Replace GOOGLE_API_KEY with your own key',
                          text_color='red', text_align='center'))

plot.title.text = "Cities of the world with a population over 5,000 people."

circle = Circle(x="lng", y="lat", size=5, line_color=None, fill_color='firebrick', fill_alpha=0.2)
plot.add_glyph(ColumnDataSource(data), circle)
plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "maps_cities.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps - World cities Example"))
    print("Wrote %s" % filename)
    view(filename)
