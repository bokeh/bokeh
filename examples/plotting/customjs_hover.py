''' A map of North Africa and South Europe with three interactive location
points. When hovering over the points, its lat-lon is shown. This example
demonstrates using CustomJSHover model and HoverTool to customize the
formatting of values in tooltip fields.

.. bokeh-example-metadata::
    :apis: bokeh.models.CustomJSHover, bokeh.models.HoverTool
    :refs: :ref:`ug_interaction_tools_formatting_tooltip_fields`
    :keywords: hover tool, CustomJSHover

'''
from bokeh.models import CustomJSHover, HoverTool
from bokeh.plotting import figure, show

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile("CartoDB Positron")

p.scatter(x=[0, 2000000, 4000000], y=[4000000, 2000000, 0], size=30)

code = """
    const projections = Bokeh.require("core/util/projections");
    const x = special_vars.x
    const y = special_vars.y
    const coords = projections.wgs84_mercator.invert(x, y)
    return coords[%d].toFixed(2)
"""

p.add_tools(HoverTool(
    tooltips=[
        ( 'lon', '$x{custom}' ),
        ( 'lat', '$y{custom}' ),
    ],

    formatters={
        '$x' : CustomJSHover(code=code % 0),
        '$y' : CustomJSHover(code=code % 1),
    },
))

show(p)
