""" This example demonstrates how to draw the states of the USA using the
"STATES" feature offered by the `Cartopy`_ project.
To run this example make sure `Cartopy` is installed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show
    :refs:  :ref:`ug_topics_geo_projections`
    :keywords: projection, cartopy, geo

.. _Cartopy: https://cartopy.readthedocs.io
"""
from cartopy.crs import PlateCarree

from bokeh.palettes import Category20
from bokeh.plotting import figure, show

projection = PlateCarree()

p = figure(
    title=f"States of the USA using the {projection.__class__.__name__} projection",
    x_range=(-180,-60),
    y_range=(15,80),
)
p.borders(projection)
p.coastlines(projection)
p.states(
    projection,
    draw_polygon_border=True,
    polygon_border_color="black",
    color=Category20[13],
)
show(p)
