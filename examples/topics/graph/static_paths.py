'''Supply explicit paths for graph edges.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphRenderer, bokeh.models.GraphDataSource
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, edge paths, bezier

'''

from bokeh.models import (ColumnDataSource, GraphDataSource, GraphRenderer,
                          LabelSet, MultiLine, Scatter, StaticLayoutProvider)
from bokeh.plotting import figure, show

positions = {
    "SEA": (-2.5, 1.0),
    "SFO": (-2.5, -1.0),
    "DEN": (-0.9, 0.15),
    "ORD": (0.7, 0.9),
    "AUS": (0.6, -0.9),
    "NYC": (2.5, 0.9),
    "MIA": (2.5, -1.0),
}

nodes = [
    {"id": "SEA", "label": "SEA", "color": "#2563eb"},
    {"id": "SFO", "label": "SFO", "color": "#2563eb"},
    {"id": "DEN", "label": "DEN", "color": "#7c3aed"},
    {"id": "ORD", "label": "ORD", "color": "#0f766e"},
    {"id": "AUS", "label": "AUS", "color": "#c2410c"},
    {"id": "NYC", "label": "NYC", "color": "#0f766e"},
    {"id": "MIA", "label": "MIA", "color": "#c2410c"},
]

routes = [
    ("SEA", "DEN", 0.18, "Northwest", "#2563eb"),
    ("SFO", "DEN", -0.18, "Pacific", "#2563eb"),
    ("DEN", "ORD", 0.16, "Mountain", "#7c3aed"),
    ("DEN", "AUS", -0.16, "Frontier", "#7c3aed"),
    ("ORD", "NYC", 0.18, "Northeast", "#0f766e"),
    ("AUS", "MIA", -0.18, "Gulf", "#c2410c"),
    ("ORD", "MIA", 0.22, "Coastal", "#0891b2"),
    ("AUS", "NYC", -0.22, "Atlantic", "#ea580c"),
]


def quadratic_path(start, end, bend, *, steps=50):
    x0, y0 = start
    x1, y1 = end
    cx = (x0 + x1)/2 - bend*(y1 - y0)
    cy = (y0 + y1)/2 + bend*(x1 - x0)

    path = []
    for i in range(steps + 1):
        t = i/steps
        path.append((
            (1-t)**2*x0 + 2*(1-t)*t*cx + t**2*x1,
            (1-t)**2*y0 + 2*(1-t)*t*cy + t**2*y1,
        ))
    return path


source = GraphDataSource(
    nodes=nodes,
    edges=[(start, end) for start, end, _, _, _ in routes],
)
assert isinstance(source.edges, ColumnDataSource)

paths = [quadratic_path(positions[start], positions[end], bend) for start, end, bend, _, _ in routes]
source.edges.data.update(
    xs=[[x for x, _ in path] for path in paths],
    ys=[[y for _, y in path] for path in paths],
    route=[name for _, _, _, name, _ in routes],
    color=[color for _, _, _, _, color in routes],
)

graph = GraphRenderer(
    data_source=source,
    layout_provider=StaticLayoutProvider(graph_layout=positions),
    inspection_target="edges",
)

node = Scatter(size=38, fill_color="color", line_color="white", line_width=2)
graph.node_renderer.glyph = node

edge = MultiLine(line_color="color", line_alpha=0.7, line_width=3)
graph.edge_renderer.glyph = edge
graph.edge_renderer.hover_glyph = edge.clone(line_alpha=1, line_width=5)

plot = figure(
    title="Static edge paths — curved routes supplied explicitly",
    width=820, height=500,
    x_range=(-3, 3), y_range=(-1.6, 1.6),
    tools="hover,reset", toolbar_location="above",
    background_fill_color="#f8fafc", outline_line_color=None,
)
plot.axis.visible = False
plot.grid.visible = False
plot.toolbar.logo = None
plot.renderers.append(graph)

labels = ColumnDataSource(dict(
    x=[position[0] for position in positions.values()],
    y=[position[1] for position in positions.values()],
    label=[node["label"] for node in nodes],
))
plot.add_layout(LabelSet(
    x="x", y="y", text="label", source=labels,
    text_align="center", text_baseline="middle",
    text_color="white", text_font_size="10px", text_font_style="bold",
))
plot.hover.tooltips = [
    ("Route", "@route"),
    ("From", "@start"),
    ("To", "@end"),
]

show(plot)
