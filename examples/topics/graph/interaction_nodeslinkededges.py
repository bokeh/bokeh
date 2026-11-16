'''Select a station and its connecting lines.

.. bokeh-example-metadata::
    :apis: bokeh.models.NodesAndLinkedEdges, bokeh.models.TapTool
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, selection
'''

from bokeh.models import (
    ColumnDataSource,
    LabelSet,
    NodesAndLinkedEdges,
    StaticLayoutProvider,
)
from bokeh.plotting import figure, show

positions = {
    "Library": (0, 0), "Park": (1, 1), "Market": (1, -1),
    "Station": (2, 0), "Harbor": (3, 0),
}
links = [
    ("Library", "Park"), ("Library", "Market"),
    ("Park", "Station"), ("Market", "Station"), ("Station", "Harbor"),
]

plot = figure(
    title="Tap a stop to highlight its connections",
    width=640, height=350, x_range=(-0.55, 3.55), y_range=(-1.5, 1.6),
    tools="tap,reset", toolbar_location="above",
    background_fill_color="#f8fafc", outline_line_color=None,
)
plot.axis.visible = False
plot.grid.visible = False
plot.toolbar.logo = None
plot.graph(
    list(positions), links, StaticLayoutProvider(graph_layout=positions),
    selection_policy=NodesAndLinkedEdges(),
    node_size=22, node_fill_color="#2563eb", node_line_color="white",
    node_selection_fill_color="#f28e2b", node_nonselection_fill_color="#94a3b8",
    edge_line_color="#64748b", edge_line_width=3,
    edge_selection_line_color="#f28e2b", edge_nonselection_line_alpha=0.22,
)
labels = ColumnDataSource(dict(
    x=[x for x, _ in positions.values()],
    y=[y for _, y in positions.values()],
    name=list(positions),
))
plot.add_layout(LabelSet(
    x="x", y="y", text="name", source=labels, y_offset=15,
    text_align="center", text_color="#17324d", text_font_size="12px",
))

show(plot)
