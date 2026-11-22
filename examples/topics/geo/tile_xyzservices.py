''' Display an interactive basemap from an xyzservices tile provider.

The plot ranges specify the region in Web Mercator coordinates.

.. bokeh-example-metadata::
    :title: Choose a basemap with xyzservices
    :keywords: map plot, tiles, geo
    :apis: bokeh.plotting.figure.add_tile
    :refs: :ref:`ug_topics_geo_tile_provider_maps`
    :gallery: A map plot using Bokeh's integration with xyzservices for tile providers.

'''
import xyzservices.providers as xyz

from bokeh.plotting import figure, show

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 6000000), y_range=(-1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile(xyz.OpenStreetMap.Mapnik)

show(p)
