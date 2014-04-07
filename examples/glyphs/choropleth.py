from __future__ import print_function

import os

from bokeh.sampledata import us_states, us_counties, unemployment
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph, PanTool, WheelZoomTool, ResizeTool
)
from bokeh.glyphs import Patches
from bokeh import session

us_states = us_states.data.copy()
us_counties = us_counties.data
unemployment = unemployment.data

del us_states['HI']
del us_states['AK']

state_source = ColumnDataSource(
    data=dict(
        state_xs=[us_states[code]['lons'] for code in us_states],
        state_ys=[us_states[code]['lats'] for code in us_states],
    )
)

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
for county_id in us_counties:
    if us_counties[county_id]['state'] in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']:
        continue
    try:
        rate = unemployment[county_id]
        idx = min(int(rate/2), 5)
        county_colors.append(colors[idx])
    except KeyError:
        county_colors.append("black")

county_source = ColumnDataSource(
    data=dict(
        county_xs=[us_counties[code]['lons'] for code in us_counties if us_counties[code]['state'] not in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']],
        county_ys=[us_counties[code]['lats'] for code in us_counties if us_counties[code]['state'] not in ['ak', 'hi', 'pr', 'gu', 'vi', 'mp', 'as']],
        county_colors=county_colors
    )
)

xdr = DataRange1d(sources=[state_source.columns("state_xs")])
ydr = DataRange1d(sources=[state_source.columns("state_ys")])

county_patches = Patches(xs="county_xs", ys="county_ys", fill_color="county_colors", fill_alpha=0.7, line_color="white", line_width=0.5)
state_patches = Patches(xs="state_xs", ys="state_ys", fill_alpha=0.0, line_color="#884444", line_width=2)

county_renderer = Glyph(
        data_source = county_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = county_patches,
        )

state_renderer = Glyph(
        data_source = state_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = state_patches,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[state_source, county_source], min_border=0, border_fill="white", title="2009 Unemployment Data", width=1300, height=800)

resizetool = ResizeTool(plot=plot)

plot.renderers.append(county_renderer)
plot.renderers.append(state_renderer)
plot.tools = [resizetool]

sess = session.HTMLFileSession("choropleth.html")
sess.add_plot(plot)

if __name__ == "__main__":
    sess.save()
    print("Wrote %s" % sess.filename)
    sess.view()
