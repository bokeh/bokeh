''' Render four triangles that share a center vertex.

.. bokeh-example-metadata::
    :apis: bokeh.models.MeshDataSource, bokeh.plotting.figure.polygons
    :refs: :ref:`ug_basic_areas_meshes`
    :keywords: mesh, indexed geometry, polygon
'''

from bokeh.models import MeshDataSource
from bokeh.plotting import figure, show

mesh = MeshDataSource(
    vertices=[(0, 0), (2, 0), (2, 2), (0, 2), (1, 1)],
    cells=[
        ([0, 1, 4], {"color": "#e84d60"}),
        ([1, 2, 4], {"color": "#f5a623"}),
        ([2, 3, 4], {"color": "#5abf90"}),
        ([3, 0, 4], {"color": "#4c78a8"}),
    ],
)

p = figure(width=400, height=400, match_aspect=True)
p.polygons(mesh, fill_color="color", line_color="white", line_width=3)

show(p)
