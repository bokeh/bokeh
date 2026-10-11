""" This example displays a CartoDB Positron base world map.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_tile
    :refs:  :ref:`ug_topics_geo`
    :keywords: map, geo, tiles

"""
from os import getenv

import xyzservices.providers as xyz

from bokeh.plotting import figure, show

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 2000000), y_range=(1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")

tile_provider = xyz.CartoDB.Positron(
    url=xyz.CartoDB.Positron.url + "?key=" + getenv("CARTO_API_KEY", "CARTO_API_KEY"),
)
p.add_tile(tile_provider, retina=True)

show(p)
