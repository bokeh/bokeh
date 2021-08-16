import xyzservices.providers as xyz

from bokeh.plotting import figure, show
from bokeh.tile_providers import get_provider

tile_provider = get_provider(xyz.OpenStreetMap.Mapnik)

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile(tile_provider)

show(p)
