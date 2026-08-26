''' A color-mapped map plot based on unemployment rate data. This example
demonstrates using a ``LogColorMapper`` and hover tool.

.. bokeh-example-metadata::
    :sampledata: unemployment, us_counties
    :apis: bokeh.plotting.figure.polygons, bokeh.models.mappers.LogColorMapper
    :refs: :ref:`ug_interaction_tools_hover_tool`
    :keywords: colormap, map, patches

'''
from math import isfinite

from bokeh.models import LogColorMapper
from bokeh.palettes import Viridis6 as palette
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment import data as unemployment
from bokeh.sampledata.us_counties import data as counties

palette = tuple(reversed(palette))

counties = {
    code: county for code, county in counties.items() if county["state"] == "tx"
}

color_mapper = LogColorMapper(palette=palette)

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

records = [
    {
        "geometry": geometry_from_nan_separated_xy(county["lons"], county["lats"]),
        "name": county["name"],
        "rate": unemployment[county_id],
    }
    for county_id, county in counties.items()
]

TOOLS = "pan,wheel_zoom,reset,hover,save"

p = figure(
    title="Texas Unemployment, 2009", tools=TOOLS,
    x_axis_location=None, y_axis_location=None,
    tooltips=[
        ("Name", "@name"), ("Unemployment rate", "@rate%"), ("(Long, Lat)", "($x, $y)"),
    ])
p.grid.grid_line_color = None
p.hover.point_policy = "follow_mouse"

p.polygons(records, fill_color={'field': 'rate', 'transform': color_mapper},
           fill_alpha=0.7, line_color="white", line_width=0.5)

show(p)
