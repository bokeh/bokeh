import json

from bokeh.driving import repeat
from bokeh.models import GeoJSONDataSource
from bokeh.plotting import curdoc, figure
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

p = figure(tools='box_select', x_range=(-5, 1), y_range=(49, 56),
           title="geojson updating on and off")
p.circle(x='x', y='y', size=10, line_color=None, fill_alpha=0.8, source=source)

@repeat([0,1])
def update(i):
    # alternate between original/updated
    source.geojson = [original, updated][i]

# Manually call callback so plot loads with data
update(0)

doc = curdoc()
doc.add_root(p)
doc.add_periodic_callback(update, 300)
