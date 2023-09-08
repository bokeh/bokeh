'''This example shows an unemployment map by county of the United States of America in 2009.
It demonstrates drawing shapes using polygonal data, as well as using color scales to indicate different integer ranges

.. bokeh-example-metadata::
    :sampledata: us_counties, us_states, unemployment
    :apis: bokeh.plotting.figure.patches, bokeh.palettes.Viridis6, bokeh.plotting.show
    :refs: :ref:`ug_basic_areas_patches`
    :keywords: colormap, shapes, vector, polygon
'''

from bokeh.palettes import Viridis6
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment import data as unemployment
from bokeh.sampledata.us_counties import data as counties
from bokeh.sampledata.us_states import data as states

states = states.copy()

del states["HI"]
del states["AK"]

EXCLUDED = ("ak", "hi", "pr", "gu", "vi", "mp", "as")

state_xs = [states[code]["lons"] for code in states]
state_ys = [states[code]["lats"] for code in states]

county_xs = [counties[code]["lons"] for code in counties if counties[code]["state"] not in EXCLUDED]
county_ys = [counties[code]["lats"] for code in counties if counties[code]["state"] not in EXCLUDED]

county_colors = []
for county_id in counties:
    if counties[county_id]["state"] in EXCLUDED:
        continue
    try:
        rate = unemployment[county_id]
        idx = int(rate/6)
        county_colors.append(Viridis6[idx])
    except KeyError:
        county_colors.append("black")

p = figure(title="US Unemployment 2009",
           x_axis_location=None, y_axis_location=None,
           width=1000, height=600)
p.grid.grid_line_color = None

p.patches(county_xs, county_ys,
          fill_color=county_colors, fill_alpha=0.7,
          line_color="white", line_width=0.5)

p.patches(state_xs, state_ys, fill_alpha=0.0,
          line_color="#884444", line_width=2, line_alpha=0.3)

show(p)  # Change to save(p) to save but not show the HTML file
