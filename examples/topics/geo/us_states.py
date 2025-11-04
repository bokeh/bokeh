''' This example demonstrates how to draw the states of the USA using the
"states" feature offered by the `Cartopy`_ project.
To run this example make sure `Cartopy` is installed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show
    :refs:  :ref:`ug_topics_geo_projections`
    :keywords: projection, cartopy, geo

.. _Cartopy: https://cartopy.readthedocs.io
'''
from cartopy.crs import PlateCarree
from bokeh.palettes import Category20
from bokeh.plotting import figure, show
from bokeh.plotting.geo_feature import (
    add_borders,
    add_coastlines,
    add_states,
)

projection = PlateCarree()

p = figure(
    title=f"States of the USA using the {type(projection).__name__} projection",
    x_range=(-180,-60),
    y_range=(15,80),
)
p = add_borders(p, projection)
p = add_coastlines(p, projection)
p = add_states(p, projection, draw_polygon_border=True, color=Category20[13])
show(p)
