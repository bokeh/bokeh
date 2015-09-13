import pandas as pd
from bokeh.io import output_file, save
from bokeh.embed import file_html
from bokeh.resources import Resources
from bokeh.models import (
    Circle, GMapPlot, DataRange1d, ColumnDataSource,
    PanTool, WheelZoomTool, BoxSelectTool, BoxZoomTool,
    BoxSelectionOverlay, GMapOptions
)
from bokeh.resources import CDN
from jinja2 import Template

# Process the data
stations = pd.read_json('stations.json').T
stations = stations.rename(columns={0: 'latitude', 1: 'longitude', 2: 'name', 3: 'data'})

x_range = DataRange1d()
y_range = DataRange1d()

map_options = GMapOptions(
    lat=37.76487, lng=-122.41948, zoom=8, map_type="roadmap"
)

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    title=None,
    toolbar_location=None,
    min_border=0,
)

circle = Circle(y="longitude", x="latitude", size=10, fill_color="red", line_color=None)
plot.add_glyph(ColumnDataSource(stations), circle)

plot.add_tools(PanTool(), WheelZoomTool())

with open('bokeh_google.template', 'r') as f:
    template = Template(f.read())

html = file_html(plot, CDN, "Map", template=template)
with open('bokeh_google_station_map.html', 'w') as f:
    f.write(html)
