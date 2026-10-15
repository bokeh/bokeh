''' Arrowhead decorations on existing Segment and MultiLine renderers.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.segment, bokeh.plotting.figure.multi_line, bokeh.models.GlyphRenderer.add_path_decoration
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows, decorations, segments, multiline

'''
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, NormalHead, OpenHead
from bokeh.plotting import figure, show

source = ColumnDataSource(dict(
    x0=[0.5, 0.5, 0.5], y0=[1, 2, 3],
    x1=[4.5, 4.5, 4.5], y1=[1.3, 2.3, 3.3],
    xs=[[0.5, 2.5, 4.5]]*3,
    ys=[[1, 1.6, 1.3], [2, 2.6, 2.3], [3, 3.6, 3.3]],
    color=["#0072B2", "#009E73", "#CC79A7"],
    head_size=[12, 18, 24], inset=[0, 12, 24],
))

segments = figure(width=650, height=260, x_range=(0, 5), y_range=(0.5, 4),
                  title="Segments: vectorized head sizes and end insets",
                  tools="", toolbar_location=None)
renderer = segments.segment("x0", "y0", "x1", "y1", source=source,
                            line_color="color", line_width=2)
renderer.add_path_decoration(
    NormalHead(size="head_size", fill_color="color", line_color="color"),
    node="end", inset="inset",
)

paths = figure(width=650, height=260, x_range=(0, 5), y_range=(0.5, 4),
               title="MultiLine: arrowheads follow the path's final tangent",
               tools="", toolbar_location=None)
renderer = paths.multi_line("xs", "ys", source=source,
                            line_color="color", line_width=2)
renderer.add_path_decoration(OpenHead(size=12, line_color="color"), node="start")
renderer.add_path_decoration(
    NormalHead(size="head_size", fill_color="color", line_color="color"),
    node="end", inset="inset",
)

layout = column(segments, paths)
show(layout)
