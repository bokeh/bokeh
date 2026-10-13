''' Select edges together with the node at each endpoint.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphDataSource, bokeh.models.GraphSelectionPolicy
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, selection, edge endpoints
'''

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Div,
    GraphDataSource,
    GraphRenderer,
    GraphSelectionPolicy,
    HoverTool,
    LabelSet,
    MultiLine,
    NormalHead,
    Scatter,
    StaticLayoutProvider,
    TapTool,
)
from bokeh.plotting import figure, show

NODES = list("ABCDEFGH")
EDGE_PAIRS = [
    ("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"), ("C", "G"),
    ("D", "E"), ("D", "F"), ("E", "F"), ("F", "G"), ("G", "H"),
]
LAYOUT = {
    "A": (-1.05, 0.55), "B": (-0.55, 1.0), "C": (-0.55, 0.1),
    "D": (0.0, 0.55), "E": (0.55, 1.0), "F": (0.55, 0.1),
    "G": (0.0, -0.45), "H": (0.8, -0.55),
}

source = GraphDataSource(
    nodes=[{"id": node} for node in NODES],
    edges=EDGE_PAIRS,
    selection_policy=GraphSelectionPolicy(include_end_nodes=True),
)
graph = GraphRenderer(
    data_source=source,
    layout_provider=StaticLayoutProvider(graph_layout=LAYOUT),
    selection_target="edges",
    inspection_target="edges",
)

node = Scatter(size=34, fill_color="#76a5d5", line_color="white", line_width=2)
graph.node_renderer.glyph = node
graph.node_renderer.selection_glyph = node.clone(fill_color="#f28e2b", line_color="#9a4d00")
graph.node_renderer.nonselection_glyph = node.clone(fill_color="#d4dae3", fill_alpha=0.45, line_alpha=0.7)

edge = MultiLine(line_color="#718096", line_alpha=0.75, line_width=6)
graph.edge_renderer.glyph = edge
graph.edge_renderer.selection_glyph = edge.clone(line_color="#f28e2b", line_alpha=1, line_width=9)
graph.edge_renderer.nonselection_glyph = edge.clone(line_color="#d4dae3", line_alpha=0.4, line_width=3)
graph.edge_renderer.add_path_decoration(
    NormalHead(size=16, fill_color="#718096", line_color=None),
    node="end",
    inset=18,
    selection_marking=NormalHead(size=21, fill_color="#f28e2b", line_color=None),
    nonselection_marking=NormalHead(size=12, fill_color="#d4dae3", fill_alpha=0.55, line_color=None),
)

plot = figure(
    width=720,
    height=580,
    sizing_mode="scale_width",
    max_width=720,
    x_range=(-1.3, 1.3),
    y_range=(-0.85, 1.25),
    x_axis_location=None,
    y_axis_location=None,
    toolbar_location="above",
    tools="reset",
    background_fill_color="#f8fafc",
    border_fill_color="white",
    outline_line_color="#cbd5e1",
)
plot.grid.grid_line_color = None
plot.renderers.append(graph)

tap = TapTool(renderers=[graph])
hover = HoverTool(renderers=[graph], tooltips=[("Edge", "@start → @end")])
plot.add_tools(tap, hover)
plot.toolbar.active_tap = tap

label_source = ColumnDataSource(data={
    "x": [LAYOUT[node][0] for node in NODES],
    "y": [LAYOUT[node][1] for node in NODES],
    "label": NODES,
})
plot.add_layout(LabelSet(
    x="x", y="y", text="label", source=label_source,
    text_align="center", text_baseline="middle", text_font_style="bold",
    text_color="#17324d",
))

header = Div(sizing_mode="stretch_width", max_width=760, text="""
<h2 style="margin: 0 0 0.35em">Select edges and their endpoint nodes</h2>
<p style="margin: 0"><b>Click a directed edge.</b> The edge and the node at each
end turn orange. Arrowheads show
edge direction; endpoint expansion includes both ends. Hover identifies the
directly hit edge without changing the selection.</p>
<p><code>GraphSelectionPolicy(include_end_nodes=True)</code></p>
""")
status = Div(sizing_mode="stretch_width", max_width=760, text="<b>Current selection:</b> no nodes or edges")
callback = CustomJS(args=dict(nodes=source.nodes, edges=source.edges, status=status), code="""
    const node_ids = nodes.get("index")
    const starts = edges.get("start")
    const ends = edges.get("end")
    const selected_nodes = nodes.selected.indices.map((i) => node_ids[i])
    const selected_edges = edges.selected.indices.map((i) => `${starts[i]} → ${ends[i]}`)
    const node_text = selected_nodes.length != 0 ? selected_nodes.join(", ") : "none"
    const edge_text = selected_edges.length != 0 ? selected_edges.join(", ") : "none"
    status.text = `<b>Current selection:</b> edges ${edge_text} &nbsp;|&nbsp; endpoint nodes ${node_text}`
""")
source.nodes.selected.js_on_change("indices", callback)
source.edges.selected.js_on_change("indices", callback)

show(column(header, plot, status, sizing_mode="stretch_width", max_width=760))
