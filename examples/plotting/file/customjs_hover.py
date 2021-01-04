from bokeh.io import output_file, show
from bokeh.models import CustomJSHover, HoverTool
from bokeh.plotting import figure
from bokeh.tile_providers import CARTODBPOSITRON, get_provider

output_file("customjs_hover.html")

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile(get_provider(CARTODBPOSITRON))

p.circle(x=[0, 2000000, 4000000], y=[4000000, 2000000, 0], size=30)

code = """
    var projections = Bokeh.require("core/util/projections");
    var x = special_vars.x
    var y = special_vars.y
    var coords = projections.wgs84_mercator.invert(x, y)
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
    }
))

show(p)
