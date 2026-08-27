''' This example demonstrates the use of GeoJSON data in Bokeh to create a scatter plot.

.. bokeh-example-metadata::
    :sampledata: sample_geojson
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure, bokeh.plotting.show
    :refs:  :ref:`ug_topics_geo`
    :keywords: geojson, scatter, color, map
'''

import json

from bokeh.models import GeometryDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.sample_geojson import geojson

data = json.loads(geojson)

for i in range(len(data['features'])):
    data['features'][i]['properties']['Color'] = ['blue', 'red'][i%2]

geo_source = GeometryDataSource(json.dumps(data))

TOOLTIPS = [('Organisation', '@OrganisationName')]

p = figure(background_fill_color="lightgrey", tooltips=TOOLTIPS)

p.scatter(x='x', y='y', size=15, color='Color', alpha=0.7, source=geo_source)

show(p)
