# Bokeh imports
from bokeh.models import (
    GeometryDataSource,
    GlyphRenderer,
    Plot,
    Polygons,
)

source = GeometryDataSource([
    {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[0, 0, 3], [4, 0, 3], [4, 4, 3], [0, 0, 3]],
                [[1, 1, 3], [2, 1, 3], [1, 2, 3], [1, 1, 3]],
            ],
        },
        "name": "A",
        "color": "navy",
    },
    {
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": [
                [[[6, 0], [8, 0], [8, 2], [6, 0]]],
                [[[6, 3], [9, 3], [9, 5], [6, 3]]],
            ],
        },
        "name": "B",
        "color": "firebrick",
    },
])

output = Plot(renderers=[
    GlyphRenderer(glyph=Polygons(fill_color="color"), data_source=source),
])
