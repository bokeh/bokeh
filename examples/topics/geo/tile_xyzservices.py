''' A geographical plot that demonstrates how to use XYZ tile services to create an interactive map.
The xyzservices provides map tiles, which are typically used to display maps visualizations 
and geographical location in web applications. This example demonstrates how to create a plot in Bokeh
with a map background using tile_providers. The chart shows a map of a specific geographical region, 
which is defined by the range bounds supplied in web mercator coordinates.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.Figure, bokeh.tile_providers.get_provider, bokeh.tile_provider.Vendors
    :refs: :ref:`ug_topics_geo_tile_provider_maps`
    :keywords: map plot, tiles, geo


'''

import xyzservices.providers as xyz
from bokeh.plotting import figure, show
from bokeh.tile_providers import get_provider, Vendors

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")

# Retrieve the OpenStreetMap.Mapnik tile source from the tile providers
tile_provider = get_provider(Vendors.CARTODBPOSITRON)
p.add_tile(tile_provider)

show(p)
