from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Patches
from bokeh.models import Plot, DataRange1d, ColumnDataSource
from bokeh.palettes import Viridis11
from bokeh.resources import INLINE
from bokeh.sampledata import us_states, us_counties, unemployment

us_states = us_states.data.copy()
us_counties = us_counties.data
unemployment = unemployment.data

del us_states["HI"]
del us_states["AK"]

state_source = ColumnDataSource(
    data=dict(
        state_xs=[us_states[code]["lons"] for code in us_states],
        state_ys=[us_states[code]["lats"] for code in us_states],
    )
)

county_colors = []
for county_id in us_counties:
    if us_counties[county_id]["state"] in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]:
        continue
    try:
        rate = unemployment[county_id]
        idx = min(int(rate/2), 10)
        county_colors.append(Viridis11[idx])
    except KeyError:
        county_colors.append("black")

county_source = ColumnDataSource(
    data=dict(
        county_xs=[us_counties[code]["lons"] for code in us_counties if us_counties[code]["state"] not in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]],
        county_ys=[us_counties[code]["lats"] for code in us_counties if us_counties[code]["state"] not in ["ak", "hi", "pr", "gu", "vi", "mp", "as"]],
        county_colors=county_colors
    )
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr, min_border=0, border_fill_color="white",
            plot_width=1300, plot_height=700)
plot.title.text = "2009 Unemployment Data"
plot.toolbar_location = None

county_patches = Patches(xs="county_xs", ys="county_ys", fill_color="county_colors", fill_alpha=0.7, line_color="white", line_width=0.5)
plot.add_glyph(county_source, county_patches)

state_patches = Patches(xs="state_xs", ys="state_ys", fill_alpha=0.0, line_color="#884444", line_width=2)
plot.add_glyph(state_source, state_patches)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "choropleth.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Choropleth of all US counties, Unemployment 2009"))
    print("Wrote %s" % filename)
    view(filename)
