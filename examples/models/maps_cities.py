''' A Google Map of Earth marked with all cities with at least 5,000 people.

Rather than hard-coding latitude/longitude coordinates, this example
programmatically draws many such points from a larger data source.

Rendering this plot requires a Google Maps Platform `API key`_, which is
supplied as a command-line argument to the rendering script: ``python3 gmap.py
<GOOGLE_API_KEY>``.

.. bokeh-example-metadata::
    :sampledata: world_cities
    :apis: bokeh.models.sources.ColumnDataSource, bokeh.models.map_plots.GMapOptions, bokeh.models.map_plots.GMapPlot
    :refs: :ref:`ug_topics_geo` > :ref:`ug_topics_geo_google_maps`
    :keywords: mapping, Google Maps, geographical data, GIS, latitude, longitude

.. _API key: https://developers.google.com/maps/documentation/javascript/get-api-key
'''
from sys import argv

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Circle, ColumnDataSource, GMapOptions,
                          GMapPlot, Label, PanTool, WheelZoomTool)
from bokeh.resources import INLINE
from bokeh.sampledata.world_cities import data
from bokeh.util.browser import view

# For GMaps to function, Google requires you obtain and enable an API key:
#
#     https://developers.google.com/maps/documentation/javascript/get-api-key
#
# Use an API key supplied as a command-line argument:
API_KEY = argv[1]

map_options = GMapOptions(lat=15, lng=0, zoom=2)

plot = GMapPlot(
    width=1000, height=500,
    map_options=map_options, api_key=API_KEY, output_backend="webgl",
)

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
