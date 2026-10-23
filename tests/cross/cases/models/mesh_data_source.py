# Bokeh imports
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    MeshDataSource,
    MultiLine,
    Plot,
    Polygons,
)
from bokeh.transform import gather

vertices = ColumnDataSource(dict(
    x=[0, 2, 2, 0],
    y=[0, 0, 2, 2],
))
cells = ColumnDataSource(dict(
    vertices=[[0, 1, 2], [0, 2, 3]],
    value=[1, 2],
))
mesh = MeshDataSource(vertices=vertices, cells=cells)

output = Plot(renderers=[
    GlyphRenderer(
        glyph=Polygons(fill_color="value"),
        data_source=mesh,
    ),
    GlyphRenderer(
        glyph=MultiLine(
            xs=gather(vertices, "x"),
            ys=gather(vertices, "y"),
            line_width="value",
        ),
        data_source=cells,
    ),
])
