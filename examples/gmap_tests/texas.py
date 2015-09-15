from collections import OrderedDict

from bokeh.sampledata import us_counties, unemployment
from bokeh.plotting import figure, show, output_file, ColumnDataSource
from bokeh.models import (
    HoverTool, Patches, GMapPlot, GMapOptions,
    DataRange1d, Patch, PanTool, WheelZoomTool, CrosshairTool,
    LinearAxis, Circle
)

state = "tx"

county_xs=[
    us_counties.data[code]['lons'] for code in us_counties.data
    if us_counties.data[code]['state'] == state
]
county_corner_x = [
    us_counties.data[code]['lons'][0] for code in us_counties.data
    if us_counties.data[code]['state'] == state
]
county_ys = [
    us_counties.data[code]['lats'] for code in us_counties.data
    if us_counties.data[code]['state'] == state
]
county_corner_y = [
    us_counties.data[code]['lats'][0] for code in us_counties.data
    if us_counties.data[code]['state'] == state
]

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
county_names = []
county_rates = []
for county_id in us_counties.data:
    if us_counties.data[county_id]['state'] != state:
        continue
    rate = unemployment.data[county_id]
    idx = min(int(rate/2), 5)
    county_colors.append(colors[idx])
    county_names.append(us_counties.data[county_id]['name'])
    county_rates.append(rate)

source = ColumnDataSource(
    data = dict(
        x=county_xs,
        y=county_ys,
        county_corner_x=county_corner_x,
        county_corner_y=county_corner_y,
        color=county_colors,
        name=county_names,
        rate=county_rates,
    )
)

output_file("texas.html", title="texas.py example", mode='inline')

x_range = DataRange1d()
y_range = DataRange1d()

map_options = GMapOptions(
    lat=29.9, lng=-95.4, zoom=6, map_type="roadmap"
)

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    title=None,
)

patches = Patches(
    xs='x', ys='y',
    fill_color='color', fill_alpha=0.7,
    line_color="white", line_width=0.5)

circle = Circle(
    x='county_corner_x', y='county_corner_y', size=10, fill_color='blue'
)

plot.add_glyph(source, patches)
plot.add_glyph(source, circle)
plot.add_tools(PanTool(), WheelZoomTool(), CrosshairTool())
plot.add_layout(LinearAxis(), 'left')
plot.add_layout(LinearAxis(), 'below')
show(plot)
