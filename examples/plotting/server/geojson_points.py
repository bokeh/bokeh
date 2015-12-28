# You must first run "bokeh serve" to view this example

import json

from bokeh.client import push_session
from bokeh.driving import repeat
from bokeh.io import curdoc
from bokeh.models import GeoJSONDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sample_geojson import geojson as original

updated = json.dumps({
    'type': 'FeatureCollection',
    'features': [{
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [-2.1208465099334717, 51.4613151550293]
        },
        "properties": {"OrganisationCode": "Q64"}
    }]
})

source = GeoJSONDataSource(geojson=original)

p = figure(tools='box_select')
p.circle(x='x', y='y', line_color=None, fill_alpha=0.8, source=source)

# open a session to keep our local document in sync with server
session = push_session(curdoc())

@repeat([0,1])
def update(i):
    # alternate between original/updated
    source.geojson = [original, updated][i]

curdoc().add_periodic_callback(update, 100)

session.show() # open the document in a browser

session.loop_until_closed() # run forever
