'''Customize graph node and edge glyphs, including their selection states.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphRenderer, bokeh.models.GraphDataSource, bokeh.models.GraphSelectionPolicy
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, glyphs, hover, selection

'''

from bokeh.models import (ColumnDataSource, Ellipse, GraphDataSource,
                          GraphRenderer, GraphSelectionPolicy, HoverTool,
                          LabelSet, MultiLine, StaticLayoutProvider)
from bokeh.plotting import figure, show

positions = {
    "input": (-2.4, 0.0),
    "ingest": (-1.2, 0.9),
    "validate": (-1.2, -0.9),
    "transform": (0.0, 0.0),
    "analyze": (1.2, 0.9),
    "visualize": (1.2, -0.9),
    "publish": (2.4, 0.0),
}

nodes = [
    {"id": "input", "label": "Input", "color": "#2563eb"},
    {"id": "ingest", "label": "Ingest", "color": "#0f766e"},
    {"id": "validate", "label": "Validate", "color": "#0f766e"},
    {"id": "transform", "label": "Transform", "color": "#7c3aed"},
    {"id": "analyze", "label": "Analyze", "color": "#c2410c"},
    {"id": "visualize", "label": "Visualize", "color": "#c2410c"},
    {"id": "publish", "label": "Publish", "color": "#2563eb"},
]
edges = [
    ("input", "ingest"), ("input", "validate"),
    ("ingest", "transform"), ("validate", "transform"),
    ("transform", "analyze"), ("transform", "visualize"),
    ("analyze", "publish"), ("visualize", "publish"),
]

source = GraphDataSource(nodes=nodes, edges=edges)
source.selection_policy = GraphSelectionPolicy(include_incident_edges=True)

graph = GraphRenderer(
    data_source=source,
    layout_provider=StaticLayoutProvider(graph_layout=positions),
)

node = Ellipse(
    width=0.88, height=0.42,
    fill_color="color", line_color="white", line_width=2,
)
graph.node_renderer.glyph = node
graph.node_renderer.selection_glyph = node.clone(line_color="#fbbf24", line_width=4)
graph.node_renderer.nonselection_glyph = node.clone(fill_alpha=0.25, line_alpha=0.25)

edge = MultiLine(line_color="#64748b", line_alpha=0.7, line_width=2)
graph.edge_renderer.glyph = edge
graph.edge_renderer.selection_glyph = edge.clone(line_color="#f59e0b", line_alpha=1, line_width=4)
graph.edge_renderer.nonselection_glyph = edge.clone(line_alpha=0.12)

plot = figure(
    title="Customized graph glyphs — click a stage to highlight its connections",
    width=820, height=480,
    x_range=(-3, 3), y_range=(-1.55, 1.55),
    tools="tap,reset", toolbar_location="above",
    background_fill_color="#f8fafc", outline_line_color=None,
)
plot.axis.visible = False
plot.grid.visible = False
plot.renderers.append(graph)

labels = ColumnDataSource(dict(
    x=[position[0] for position in positions.values()],
    y=[position[1] for position in positions.values()],
    label=[node["label"] for node in nodes],
))
plot.add_layout(LabelSet(
    x="x", y="y", text="label", source=labels,
    text_align="center", text_baseline="middle",
    text_color="white", text_font_size="12px", text_font_style="bold",
))
plot.add_tools(HoverTool(
    renderers=[graph.node_renderer],
    tooltips=[("Stage", "@label")],
))

show(plot)
