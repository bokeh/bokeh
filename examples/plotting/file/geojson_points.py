from bokeh.io import output_file, show
from bokeh.models import GeoJSONDataSource, HoverTool
from bokeh.plotting import figure
from bokeh.sampledata.sample_geojson import geojson

p = figure()

p.circle(x='x', y='y', line_color=None, fill_alpha=0.8, size=20,
         source=GeoJSONDataSource(geojson=geojson))

p.add_tools(HoverTool(tooltips=[
    ("Organisation Name", "@OrganisationName")
]))

output_file("geojson_points.html", title="GeoJSON Points")

show(p)
