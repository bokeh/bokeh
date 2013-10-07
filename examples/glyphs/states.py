
import os

from bokeh.sampledata import us_states, us_counties, unemployment
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, GlyphRenderer, PanTool, ZoomTool, ResizeTool
)
from bokeh.glyphs import Patches
from bokeh import session

del us_states.data['HI']
del us_states.data['AK']

state_source = ColumnDataSource(
    data=dict(
        state_xs=[us_states.data[code]['lons'] for code in us_states.data],
        state_ys=[us_states.data[code]['lats'] for code in us_states.data],
    )
)

colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"]

county_colors = []
for county_id in us_counties.data:
    try:
        rate = unemployment.data[county_id]
        idx = min(int(rate/2), 5)
        county_colors.append(colors[idx])
    except KeyError:
        county_colors.append("black")

county_source = ColumnDataSource(
    data=dict(
        county_xs=[us_counties.data[code]['lons'] for code in us_counties.data],
        county_ys=[us_counties.data[code]['lats'] for code in us_counties.data],
        county_colors=county_colors
    )
)

print len([us_states.data[code]['lons'] for code in us_states.data])
print len([us_states.data[code]['lats'] for code in us_states.data])

print len(county_colors)
print len([us_counties.data[code]['lons'] for code in us_counties.data])
print len([us_counties.data[code]['lats'] for code in us_counties.data])

xdr = DataRange1d(sources=[state_source.columns("state_xs")])
ydr = DataRange1d(sources=[state_source.columns("state_ys")])

county_patches = Patches(xs="county_xs", ys="county_ys", fill_color="county_colors", fill_alpha=0.7, line_color="white", line_width=0.5)
state_patches = Patches(xs="state_xs", ys="state_ys", fill_alpha=0.0, line_color="#884444", line_width=2)

county_renderer = GlyphRenderer(
        data_source = county_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = county_patches,
        )

state_renderer = GlyphRenderer(
        data_source = state_source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = state_patches,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[state_source, county_source], border=0, border_fill="white", title="2009 Unemployment Data", width=1300, height=800)

resizetool = ResizeTool(plot=plot)

plot.renderers.append(county_renderer)
plot.renderers.append(state_renderer)
plot.tools = [resizetool]

sess = session.HTMLFileSession("states.html")
sess.add(plot, county_renderer, state_renderer, state_source, county_source, xdr, ydr, resizetool)
sess.plotcontext.children.append(plot)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
print "Wrote states.html"
try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath("states.html"))
except:
    pass
