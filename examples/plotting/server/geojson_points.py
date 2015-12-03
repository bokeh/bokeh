# The plot server must be running (`bokeh serve`) then run this script to push to it

import time
import json

from bokeh.client import push_session
from bokeh.io import curdoc
from bokeh.models import GeoJSONDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sample_geojson import geojson as original

p = figure(tools='box_select')
source = GeoJSONDataSource(geojson=original)
p.circle(line_color=None, fill_alpha=0.8, source=source)

# Open a session which will keep our local doc in sync with server
session = push_session(curdoc())

# Open the session in a browser
session.show()

is_original = True

while True:
    if is_original:
        # update to something else
        source.geojson = json.dumps(
            {'type': 'FeatureCollection',
             'features': [
                 {"type": "Feature",
                  "geometry": {"type": "Point",
                               "coordinates": [-2.1208465099334717, 51.4613151550293]},
                  "properties": {"OrganisationCode": "Q64"}}
             ]}
        )
        is_original = False
    else:
        # set back to original
        source.geojson = original
        is_original = True
    time.sleep(.5)
