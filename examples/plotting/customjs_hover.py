""" A map of North Africa and South Europe with three interactive location
points. When hovering over the points, its lat-lon is shown. This example
demonstrates using CustomJSHover model and HoverTool to customize the
formatting of values in tooltip fields.

.. bokeh-example-metadata::
    :apis: bokeh.models.CustomJSHover, bokeh.models.HoverTool
    :refs: :ref:`ug_interaction_tools_formatting_tooltip_fields`
    :keywords: hover tool, CustomJSHover

"""
from bokeh.models import CustomJSHover, HoverTool
from bokeh.plotting import figure, show

# range bounds supplied in web mercator coordinates
p = figure(
    x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
    x_axis_type="mercator", y_axis_type="mercator",
)

p.add_tile("CartoDB Positron")
p.scatter(x=[0, 2000000, 4000000], y=[4000000, 2000000, 0], size=30)

formatter = CustomJSHover(code="""
    function decimal_degrees(coord) {
        return coord.toFixed(2)
    }

    function degrees_minutes_seconds(coord, axis) {
        const dir = axis == "lon" ? (coord < 0 ? "W" : "E") : (coord < 0 ? "S" : "N")
        const degrees_ = Math.abs(coord)
        const degrees  = Math.trunc(degrees_)
        const minutes_ = (degrees_ - degrees)*60
        const minutes  = Math.trunc(minutes_)
        const seconds_ = (minutes_ - minutes)*60
        const seconds  = Math.trunc(seconds_)
        return `${dir} ${degrees}\\u00b0 ${minutes}\\u2032 ${seconds}\\u2033`
    }

    const projections = Bokeh.require("core/util/projections")
    const {x, y} = special_vars
    const coords = projections.wgs84_mercator.invert(x, y)

    const [axis, type] = format.split("_")
    const dim = axis == "lon" ? 0 : 1
    const coord = coords[dim]

    switch (type) {
        case "dd":  return decimal_degrees(coord)
        case "dms": return degrees_minutes_seconds(coord, axis)
        default:    return "???"
    }
""")

p.add_tools(HoverTool(
    tooltips=[
        ("lat", "$y{lat_dd} = $y{lat_dms}"),
        ("lon", "$x{lon_dd} = $x{lon_dms}"),
    ],
    formatters={
        "$y": formatter,
        "$x": formatter,
    },
))

show(p)
