# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from bokeh.sampledata import us_counties, unemployment
from bokeh.plotting import *

county_xs=[
    us_counties.data[code]['lons'] for code in us_counties.data
    if us_counties.data[code]['state'] == 'tx'
]
county_ys=[
    us_counties.data[code]['lats'] for code in us_counties.data
    if us_counties.data[code]['state'] == 'tx'
]

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
for county_id in us_counties.data:
    if us_counties.data[county_id]['state'] != 'tx':
        continue
    try:
        rate = unemployment.data[county_id]
        idx = min(int(rate/2), 5)
        county_colors.append(colors[idx])
    except KeyError:
        county_colors.append("black")

output_server("texas")

patches(county_xs, county_ys, fill_color=county_colors, fill_alpha=0.7,
        line_color="white", line_width=0.5, title="Texas Unemployment 2009")

show()
