from bokeh.models import GeoJSONDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.sample_geojson import geojson

p = figure(tooltips=[("Organisation Name", "@OrganisationName")])

p.circle(x='x', y='y', line_color=None, fill_alpha=0.8, size=20,
         source=GeoJSONDataSource(geojson=geojson))

show(p)
