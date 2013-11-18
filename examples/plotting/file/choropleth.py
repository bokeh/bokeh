
from bokeh.sampledata import us_states, us_counties, unemployment
from bokeh.plotting import *
del us_states.data['HI']
del us_states.data['AK']

state_xs = [us_states.data[code]['lons'] for code in us_states.data]
state_ys = [us_states.data[code]['lats'] for code in us_states.data]

county_xs=[us_counties.data[code]['lons'] for code in us_counties.data if us_counties.data[code]['state'] not in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']]
county_ys=[us_counties.data[code]['lats'] for code in us_counties.data if us_counties.data[code]['state'] not in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']]

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
for county_id in us_counties.data:
    if us_counties.data[county_id]['state'] in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']:
        continue
    try:
        rate = unemployment.data[county_id]
        idx = min(int(rate/2), 5)
        county_colors.append(colors[idx])
    except KeyError:
        county_colors.append("black")

output_file("choropleth.html", title="choropleth.py example")

hold()

patches(county_xs, county_ys, fill_color=county_colors, fill_alpha=0.7,
        line_color="white", line_width=0.5, width=1100, height=700,
        title="US Unemployment 2009")
patches(state_xs, state_ys, fill_alpha=0.0, line_color="#884444",
        line_width=2, name="choropleth")

show()
