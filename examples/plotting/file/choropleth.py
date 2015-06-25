from bokeh.sampledata import us_states, us_counties, unemployment
from bokeh.plotting import figure, show, output_file

us_states = us_states.data.copy()
us_counties = us_counties.data.copy()
unemployment = unemployment.data

del us_states["HI"]
del us_states["AK"]

state_xs = [us_states[code]["lons"] for code in us_states]
state_ys = [us_states[code]["lats"] for code in us_states]

county_xs=[us_counties[code]["lons"] for code in us_counties if us_counties[code]["state"] not in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]]
county_ys=[us_counties[code]["lats"] for code in us_counties if us_counties[code]["state"] not in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]]

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
for county_id in us_counties:
    if us_counties[county_id]["state"] in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]:
        continue
    try:
        rate = unemployment[county_id]
        idx = min(int(rate/2), 5)
        county_colors.append(colors[idx])
    except KeyError:
        county_colors.append("black")

output_file("choropleth.html", title="choropleth.py example")

p = figure(title="US Unemployment 2009", toolbar_location="left",
    plot_width=1100, plot_height=700)

p.patches(county_xs, county_ys, fill_color=county_colors, fill_alpha=0.7,
    line_color="white", line_width=0.5)
p.patches(state_xs, state_ys, fill_alpha=0.0,
    line_color="#884444", line_width=2)

show(p)
