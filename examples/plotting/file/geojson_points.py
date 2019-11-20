from bokeh.io import output_file, show
from bokeh.models import GeoJSONDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sample_geojson import geojson

p = figure(tooltips=[("Organisation Name", "@OrganisationName")])

p.circle(x='x', y='y', line_color=None, fill_alpha=0.8, size=20,
         source=GeoJSONDataSource(geojson=geojson))

output_file("geojson_points.html", title="GeoJSON Points")

show(p)
