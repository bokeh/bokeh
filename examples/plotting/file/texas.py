from collections import OrderedDict

from bokeh.sampledata import us_counties, unemployment
from bokeh.plotting import figure, show, output_file, ColumnDataSource
from bokeh.models import HoverTool

state = "tx"

county_xs=[
    us_counties.data[code]['lons'] for code in us_counties.data
    if us_counties.data[code]['state'] == state
]
county_ys=[
    us_counties.data[code]['lats'] for code in us_counties.data
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
        color=county_colors,
        name=county_names,
        rate=county_rates,
    )
)


output_file("texas.html", title="texas.py example")

TOOLS="pan,wheel_zoom,box_zoom,reset,hover,save"

p = figure(title="Texas Unemployment 2009", tools=TOOLS)

p.patches('x', 'y',
    fill_color='color', fill_alpha=0.7,
    line_color="white", line_width=0.5,
    source=source)

hover = p.select(dict(type=HoverTool))
hover.point_policy = "follow_mouse"
hover.tooltips = OrderedDict([
    ("Name", "@name"),
    ("Unemployment rate)", "@rate%"),
    ("(Long, Lat)", "($x, $y)"),
])

show(p)
