''' Place arrowheads from a source column, with an empty list for one path.

.. bokeh-example-metadata::
    :apis: bokeh.models.GlyphRenderer.add_path_marking, bokeh.models.ColumnDataSource, bokeh.models.NormalHead
    :refs: :ref:`ug_basic_annotations_path_markings`
    :keywords: arrowheads, fractional positions, data source, paths

'''
from math import sin, tau

from bokeh.core.properties import field
from bokeh.models import ColumnDataSource, NormalHead
from bokeh.plotting import figure, show

t = [i/100 for i in range(101)]
source = ColumnDataSource(dict(
    xs=[[6*u for u in t] for _ in range(4)],
    ys=[[-1 + row*0.8 + 0.25*sin(tau*u + row*0.6) for u in t] for row in range(4)],
    arrow_positions=[[0, 0.25, 0.5, 0.75, 1], [0.15, 0.55, 0.85], [], [0.2, 0.8]],
    color=["#56b4e9", "#ffb454", "#cc79a7", "#4dd9b4"],
))

p = figure(width=480, height=300, x_range=(-0.6, 6.6), y_range=(-1.6, 2.6),
           title="Per-path positions", tools="", toolbar_location=None,
           background_fill_color="#202a36", border_fill_color="#f6f7f9")
p.axis.visible = False
p.grid.grid_line_color = "#536779"
p.grid.grid_line_alpha = 0.3
p.outline_line_color = None

renderer = p.multi_line("xs", "ys", source=source, line_color="#c0ceda", line_width=3)
renderer.add_path_marking(
    NormalHead(size=14, fill_color="color", line_color="color"),
    at=field("arrow_positions"),
)

show(p)
