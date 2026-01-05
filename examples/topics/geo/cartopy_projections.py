""" This example demonstrates how to draw world projections offered by `Cartopy`_
using Bokeh. The shown projections are just a selection and don't present all
possible projections. To run this example make sure `Cartopy` is installed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show
    :refs:  :ref:`ug_topics_geo_projections`
    :keywords: world projection, cartopy, geo

.. _Cartopy: https://cartopy.readthedocs.io
"""
import cartopy.crs as ccrs

from bokeh.layouts import grid
from bokeh.plotting import figure, show

projections = [
    ccrs.Robinson(),
    ccrs.Mollweide(),
    ccrs.EckertIII(),
    ccrs.LambertAzimuthalEqualArea(),
]

grid_items = []
for projection in projections:
    p = figure(width=400, height=400, title=f"{projection.__class__.__name__}")
    p.coastlines(projection)
    p.projection_boundary(projection, line_width=2)
    p.grid.visible = False
    p.axis.visible = False
    grid_items.append(p)

show(grid(grid_items, ncols=2))
