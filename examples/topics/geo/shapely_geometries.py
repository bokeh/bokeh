''' Render Shapely Polygon and MultiPolygon objects with feature attributes.

.. bokeh-example-metadata::
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure.polygons
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, shapely, polygon, multipolygon, hole
'''

from shapely.geometry import MultiPolygon, Polygon

from bokeh.models import GeometryDataSource
from bokeh.plotting import figure, show


harbor = Polygon(
    [(0, 0), (5, 0), (5, 5), (0, 5)],
    holes=[[(1.2, 1.2), (3.8, 1.2), (3.8, 3.8), (1.2, 3.8)]],
)
islands = MultiPolygon([
    Polygon([(7, 0.5), (9, 0.5), (8.5, 2.5), (7, 2)]),
    Polygon([(9, 3), (11, 3.5), (10.5, 5.5), (8.5, 5)]),
])

source = GeometryDataSource([
    {"geometry": harbor, "name": "Polygon with a hole", "color": "#3b82f6"},
    {"geometry": islands, "name": "One MultiPolygon feature", "color": "#f97316"},
])

p = figure(
    width=720,
    height=420,
    x_range=(-0.8, 11.8),
    y_range=(-0.8, 6.3),
    match_aspect=True,
    title="Shapely Polygon and MultiPolygon objects",
    tools="pan,wheel_zoom,reset,tap,hover",
    tooltips=[("geometry", "@name")],
)
p.polygons(
    source=source,
    fill_color="color",
    fill_alpha=0.75,
    line_color="white",
    line_width=3,
    hover_fill_alpha=1.0,
    selection_line_color="black",
)

show(p)
