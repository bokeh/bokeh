''' A Google Map annotated with user-defined circles specified with
latitude/longitude coordinates.

Rendering this plot requires a Google Maps Platform `API key`_, which is
supplied as a command-line argument to the rendering script: ``python3 gmap.py
<GOOGLE_API_KEY>``.

.. bokeh-example-metadata::
    :apis: bokeh.models.sources.ColumnDataSource, bokeh.models.map_plots.GMapOptions, bokeh.plotting.gmap
    :refs: :ref:`ug_topics_geo` > :ref:`ug_topics_geo_google_maps`
    :keywords: mapping, Google Maps, geographical data, GIS, latitude, longitude

.. _API key: https://developers.google.com/maps/documentation/javascript/get-api-key
'''

from sys import argv

from bokeh.models import ColumnDataSource, GMapOptions
from bokeh.plotting import gmap, show

map_options = GMapOptions(lat=30.2861, lng=-97.7394, map_type="roadmap", zoom=11)

# For GMaps to function, Google requires you obtain and enable an API key:
#
#     https://developers.google.com/maps/documentation/javascript/get-api-key
#
# Use an API key supplied as a command-line argument:
p = gmap(argv[1], map_options, title="Austin")

source = ColumnDataSource(
    data=dict(lat=[ 30.29,  30.20,  30.29],
              lon=[-97.70, -97.74, -97.78])
)

p.circle(x="lon", y="lat", size=15, fill_color="blue", fill_alpha=0.8, source=source)

show(p)
