from bokeh.io import output_file, show
from bokeh.models import GeoJSONDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sample_geojson import geojson

output_file("geojson_points.html", title="GeoJSON Points")

p = figure()
p.circle(line_color=None, fill_alpha=0.8, source=GeoJSONDataSource(geojson=geojson))
show(p)
