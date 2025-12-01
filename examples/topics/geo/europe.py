""" This example demonstrates how to draw Europe using the `EuroPP` projection
and multiple features offered by the `Cartopy`_ project.
To run this example make sure `Cartopy` is installed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show
    :refs:  :ref:`ug_topics_geo_projections`
    :keywords: projection, cartopy, geo

.. _Cartopy: https://cartopy.readthedocs.io
"""
from cartopy.crs import EuroPP

from bokeh.plotting import figure, show

projection = EuroPP()

p = figure(title="Map of Europe using geo-features")
p.land(projection)
p.ocean(projection)
p.borders(projection)
p.provinces(projection, line_dash="dotted", scale="50m")
p.lakes(projection)
p.rivers(projection)
p.coastlines(projection)
p.projection_boundary(projection)
show(p)
