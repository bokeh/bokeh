''' Compare the results of common Shapely set operations.

.. bokeh-example-metadata::
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure.polygons
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, shapely, intersection, union, symmetric difference
'''

from shapely.geometry import Point

from bokeh.layouts import row
from bokeh.models import GeometryDataSource
from bokeh.plotting import figure, show

left = Point(-0.65, 0).buffer(1.2, quad_segs=64)
right = Point(0.65, 0).buffer(1.2, quad_segs=64)
inputs = GeometryDataSource([
    {"geometry": left, "color": "#2563eb"},
    {"geometry": right, "color": "#f97316"},
])

operations = [
    ("Intersection", left.intersection(right), "#7c3aed"),
    ("Union", left.union(right), "#059669"),
    ("Symmetric difference", left.symmetric_difference(right), "#db2777"),
]

plots = []
for title, geometry, color in operations:
    result = GeometryDataSource([{"geometry": geometry, "color": color}])
    p = figure(
        width=290,
        height=300,
        x_range=(-2, 2),
        y_range=(-1.5, 1.5),
        match_aspect=True,
        title=title,
        toolbar_location=None,
        outline_line_color=None,
    )
    p.axis.visible = False
    p.grid.visible = False
    p.polygons(
        source=inputs,
        fill_color="color",
        fill_alpha=0.08,
        line_color="color",
        line_alpha=0.45,
        line_dash="dashed",
        line_width=2,
    )
    p.polygons(
        source=result,
        fill_color="color",
        fill_alpha=0.72,
        line_color="white",
        line_width=2,
    )
    plots.append(p)

show(row(*plots))
