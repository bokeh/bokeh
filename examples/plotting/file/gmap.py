from bokeh.io import output_file, show
from bokeh.models import  GMapOptions
from bokeh.plotting import gmap

output_file("gmap.html")

map_options = GMapOptions(lat=30.2861, lng=-97.7394, map_type="roadmap", zoom=13)

p = gmap("GOOGLE_API_KEY", map_options)

show(p)
