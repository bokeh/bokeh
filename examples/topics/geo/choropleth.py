'''This example shows an unemployment map by county of the United States of America in 2009.
It demonstrates drawing shapes using polygonal data, as well as using color scales to indicate different integer ranges

.. bokeh-example-metadata::
    :sampledata: us_counties, us_states, unemployment
    :apis: bokeh.plotting.figure.polygons, bokeh.palettes.Viridis6, bokeh.plotting.show
    :refs: :ref:`ug_basic_areas_patches`
    :keywords: colormap, shapes, vector, polygon
'''

from math import isfinite

from bokeh.palettes import Viridis6
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment import data as unemployment
from bokeh.sampledata.us_counties import data as counties
from bokeh.sampledata.us_states import data as states

states = states.copy()

del states["HI"]
del states["AK"]

EXCLUDED = ("ak", "hi", "pr", "gu", "vi", "mp", "as")

def geometry_from_nan_separated_xy(xs, ys):
    rings = []
    ring = []
    for x, y in zip(xs, ys):
        if isfinite(x) and isfinite(y):
            ring.append([x, y])
        elif ring:
            rings.append(ring)
            ring = []
    if ring:
        rings.append(ring)

    if len(rings) == 1:
        return {"type": "Polygon", "coordinates": rings}
    return {"type": "MultiPolygon", "coordinates": [[ring] for ring in rings]}

county_records = []
for county_id in counties:
    county = counties[county_id]
    if county["state"] in EXCLUDED:
        continue
    try:
        rate = unemployment[county_id]
        idx = int(rate/6)
        color = Viridis6[idx]
    except KeyError:
        color = "black"
    county_records.append({
        "geometry": geometry_from_nan_separated_xy(county["lons"], county["lats"]),
        "color": color,
    })

state_records = [
    {"geometry": geometry_from_nan_separated_xy(state["lons"], state["lats"])}
    for state in states.values()
]

p = figure(title="US Unemployment 2009",
           x_axis_location=None, y_axis_location=None,
           width=1000, height=600)
p.grid.grid_line_color = None

p.polygons(county_records, fill_color="color", fill_alpha=0.7,
           line_color="white", line_width=0.5)

p.polygons(state_records, fill_alpha=0.0,
           line_color="#884444", line_width=2, line_alpha=0.3)

show(p)
