''' A color-mapped map plot based on unemployment rate data. This example
demonstrates using a ``LogColorMapper`` and hover tool.

.. bokeh-example-metadata::
    :sampledata: unemployment, us_counties
    :apis: bokeh.plotting.figure.polygons, bokeh.models.mappers.LogColorMapper
    :refs: :ref:`ug_interaction_tools_hover_tool`
    :keywords: colormap, map, patches

'''

from bokeh.models import LogColorMapper
from bokeh.palettes import Viridis6 as palette
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment import by_fips
from bokeh.sampledata.us_counties import records as county_records

palette = tuple(reversed(palette))

color_mapper = LogColorMapper(palette=palette)

records = [
    county | {"rate": by_fips[county["fips"]]}
    for county in county_records(state="TX")
    if county["fips"] in by_fips
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
