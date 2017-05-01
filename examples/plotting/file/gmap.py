from bokeh.io import output_file, show
from bokeh.models import GMapOptions
from bokeh.plotting import gmap
from bokeh.models import Label

output_file("gmap.html")

map_options = GMapOptions(lat=30.2861, lng=-97.7394, map_type="roadmap", zoom=13)

# replace with your google api key
p = gmap("GOOGLE_API_KEY", map_options)

if p.api_key == "GOOGLE_API_KEY":
    p.add_layout(Label(x=140, y=400, x_units='screen', y_units='screen',
                       text='Replace GOOGLE_API_KEY with your own key',
                       text_color='red'))

show(p)
