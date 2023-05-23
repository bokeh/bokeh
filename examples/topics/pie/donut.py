''' A donut chart populated with browser market share percentages. This example
demonstrates the low-level |bokeh.models| API.

.. bokeh-example-metadata::
    :apis: bokeh.models.AnnularWedge, bokeh.models.Legend
    :refs: :ref:`ug_topics_pie`
    :keywords: pandas, donut, wedge

'''
from math import pi

from bokeh.io import show
from bokeh.models import (AnnularWedge, ColumnDataSource,
                          Legend, LegendItem, Plot, Range1d)
from bokeh.sampledata.browsers import browsers_nov_2013 as df

xdr = Range1d(start=-2, end=2)
ydr = Range1d(start=-2, end=2)

plot = Plot(x_range=xdr, y_range=ydr)
plot.title.text = "Web browser market share (November 2013)"
plot.toolbar_location = None

colors = {
    "Chrome": "seagreen",
    "Firefox": "tomato",
    "Safari": "orchid",
    "Opera": "firebrick",
    "IE": "skyblue",
    "Other": "lightgray",
}

aggregated = df.groupby("Browser").sum(numeric_only=True)
selected = aggregated[aggregated.Share >= 1].copy()
selected.loc["Other"] = aggregated[aggregated.Share < 1].sum()
browsers = selected.index.tolist()

angles = selected.Share.map(lambda x: 2*pi*(x/100)).cumsum().tolist()

browsers_source = ColumnDataSource(dict(
    start  = [0] + angles[:-1],
    end    = angles,
    colors = [colors[browser] for browser in browsers],
))

glyph = AnnularWedge(x=0, y=0, inner_radius=0.9, outer_radius=1.8,
                     start_angle="start", end_angle="end",
                     line_color="white", line_width=3, fill_color="colors")
r= plot.add_glyph(browsers_source, glyph)

legend = Legend(location="center")
for i, name in enumerate(colors):
    legend.items.append(LegendItem(label=name, renderers=[r], index=i))
plot.add_layout(legend, "center")

show(plot)
