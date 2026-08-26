''' Render Polygon and MultiPolygon features without flattening geometry into columns.

.. bokeh-example-metadata::
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure.polygons
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, polygon, multipolygon, hole, webgl
'''

from bokeh.models import GeometryDataSource
from bokeh.plotting import figure, show

source = GeometryDataSource([
    {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]],
                [[1.5, 1.5], [3.5, 1.5], [3.5, 3.5], [1.5, 3.5], [1.5, 1.5]],
            ],
        },
        "name": "Polygon with a hole",
        "color": "#3b82f6",
    },
    {
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": [
                [[[7, 0], [9, 0], [9, 2], [7, 2], [7, 0]]],
                [[[7, 3], [10, 3], [10, 5], [7, 5], [7, 3]]],
            ],
        },
        "name": "One selectable MultiPolygon",
        "color": "#f97316",
    },
])

p = figure(
    width=700,
    height=400,
    match_aspect=True,
    output_backend="webgl",
    tools="pan,wheel_zoom,reset,tap,hover",
    tooltips=[("feature", "@name")],
    title="Natural Polygon and MultiPolygon geometry",
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
