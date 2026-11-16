'''Supply explicit paths for graph edges.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphDataSource, bokeh.models.StaticLayoutProvider
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, edge paths, bezier
'''

from bokeh.models import (
    ColumnDataSource,
    GraphDataSource,
    GraphRenderer,
    LabelSet,
    MultiLine,
    Scatter,
    StaticLayoutProvider,
)
from bokeh.plotting import figure, show

positions = {
    "Museum": (0, 1), "Market": (0, -1), "Central": (2, 0),
    "Harbor": (4, 1), "Gardens": (4, -1),
}
routes = [
    ("Museum", "Central", (1.5, 1), "#2563eb"),
    ("Central", "Gardens", (3.5, 0), "#2563eb"),
    ("Market", "Central", (1.5, -1), "#0f766e"),
    ("Central", "Harbor", (3.5, 0), "#0f766e"),
]


def quadratic_path(start, control, end):
    steps = [i/40 for i in range(41)]
    return [(1-t)**2*start + 2*(1-t)*t*control + t**2*end for t in steps]


source = GraphDataSource(nodes=list(positions), edges=[(start, end) for start, end, _, _ in routes])
paths = [
    [quadratic_path(a, b, c) for a, b, c in zip(positions[start], control, positions[end])]
    for start, end, control, _ in routes
]
assert isinstance(source.edges, ColumnDataSource)
source.edges.data.update(
    xs=[xs for xs, _ in paths],
    ys=[ys for _, ys in paths],
    color=[color for _, _, _, color in routes],
)

plot = figure(
    title="Two routes through Central Station",
    width=680, height=350, x_range=(-0.6, 4.6), y_range=(-1.6, 1.6),
    tools="", toolbar_location=None, background_fill_color="#f8fafc", outline_line_color=None,
)
plot.axis.visible = False
plot.grid.visible = False
graph = GraphRenderer(data_source=source, layout_provider=StaticLayoutProvider(graph_layout=positions))
graph.node_renderer.glyph = Scatter(size=20, fill_color="#f8fafc", line_color="#334155", line_width=2)
graph.edge_renderer.glyph = MultiLine(line_color="color", line_width=4)
plot.renderers.append(graph)

labels = ColumnDataSource(dict(
    x=[x for x, _ in positions.values()],
    y=[y for _, y in positions.values()],
    name=list(positions),
    offset=[-22 if name in {"Central", "Gardens"} else 20 for name in positions],
))
plot.add_layout(LabelSet(
    x="x", y="y", text="name", source=labels, y_offset="offset",
    text_align="center", text_baseline="middle", text_color="#17324d", text_font_size="12px",
))

show(plot)
