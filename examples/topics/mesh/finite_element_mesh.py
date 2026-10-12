''' Render indexed cells without repeating shared vertex coordinates.

.. bokeh-example-metadata::
    :apis: bokeh.models.MeshDataSource, bokeh.plotting.figure.polygons, bokeh.transform.linear_cmap
    :keywords: mesh, finite element, indexed geometry, polygon
'''

from bokeh.models import MeshDataSource
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap

mesh = MeshDataSource(
    vertices=[
        (0, 0), (2, 0), (2, 2), (0, 2), (1, 1),
    ],
    cells={
        "vertices": [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)],
        "stress": [0.15, 0.60, 0.90, 0.35],
    },
)

p = figure(
    width=600,
    height=500,
    match_aspect=True,
    tools="pan,wheel_zoom,reset,tap,hover",
    tooltips=[("cell", "$index"), ("stress", "@stress{0.00}")],
    title="Indexed finite-element mesh",
)

p.polygons(
    mesh,
    fill_color=linear_cmap("stress", Turbo256, low=0, high=1),
    fill_alpha=0.85,
    line_color="white",
    line_width=2,
    selection_line_color="black",
)
p.scatter(source=mesh.vertices, x="x", y="y", size=8, color="black")

show(p)
