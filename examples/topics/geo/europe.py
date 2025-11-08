''' This example demonstrates how to draw Europe using the `EuroPP` projection
and multiple features offered by the `Cartopy`_ project.
To run this example make sure `Cartopy` is installed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show
    :refs:  :ref:`ug_topics_geo_projections`
    :keywords: projection, cartopy, geo

.. _Cartopy: https://cartopy.readthedocs.io
'''
from cartopy.crs import EuroPP

from bokeh.plotting import figure, show
from bokeh.plotting.geo_feature import (add_borders, add_coastlines, add_lakes,
                                        add_land, add_ocean, add_projection_boundary,
                                        add_provinces, add_rivers)

projection = EuroPP()

p = figure(title="Map of Europe using geo-features")
p = add_land(p, projection)
p = add_ocean(p, projection)
p = add_borders(p, projection)
p = add_provinces(p, projection, line_dash="dotted", scale="50m")
p = add_lakes(p, projection)
p = add_rivers(p, projection)
p = add_coastlines(p, projection)
p = add_projection_boundary(p, projection)
show(p)
