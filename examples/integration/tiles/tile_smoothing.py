from bokeh.layouts import column
from bokeh.plotting import figure, show, output_file
from bokeh.tile_providers import CARTODBPOSITRON

output_file("tile_smoothing.html")

# range bounds supplied in web mercator coordinates
p1 = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
            x_axis_type="mercator", y_axis_type="mercator", title='Smoothed')
p2 = figure(x_axis_type="mercator", y_axis_type="mercator", title='Non-smoothed')

# Link axes
p2.x_range = p1.x_range
p2.y_range = p1.y_range

# Add smoothed tiles (the default)
r1 = p1.add_tile(CARTODBPOSITRON)

# Add non-smoothed tile
r2 = p2.add_tile(CARTODBPOSITRON, smoothing=False)

show(column(p1, p2))
