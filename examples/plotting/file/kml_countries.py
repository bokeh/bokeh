from itertools import chain

from bokeh.models import GeoJSONDataSource 
from bokeh.plotting import figure, show, output_file

from fastkml import kml
from geojson import GeometryCollection, dumps

from bokeh.sampledata.countries_kml import countries_kml_path

with open(countries_kml_path) as f:
    content = kml.KML()
    content.from_string(f.read().encode('utf-8'))

documents = list(content.features())
features = list(documents[0].features())

geometries = []
for f in features:
    geometries += list(f.geometry.geoms)

geom = GeometryCollection(geometries)
geo_source = GeoJSONDataSource(geojson=dumps(geom))

p = figure(plot_height=600, plot_width=900, tools='pan,wheel_zoom')
p.background_fill = 'black'
p.axis.visible = False
p.grid.grid_line_alpha = 0
p.patches(xs='xs', ys='ys',
          source=geo_source, line_color='white', 
          line_alpha=.2, fill_alpha=.85)

output_file('kml_countries_example.html', title='KML Countries Example')
show(p)
