from bokeh.plotting import figure, output_file, show
from bokeh.tile_providers import CARTODBPOSITRON, get_provider

output_file("tile_source.html")

# create plot and add tools
p = figure(x_range=(-2000000, 2000000), y_range=(1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile(get_provider(CARTODBPOSITRON))

show(p)
