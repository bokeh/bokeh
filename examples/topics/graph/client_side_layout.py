''' A graph using a dependency-free layout computed in BokehJS.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphDataSource, bokeh.models.ForceDirectedLayoutProvider, bokeh.models.GraphSelectionPolicy
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, layout, force-directed, selection
'''

from bokeh.layouts import column
from bokeh.models import (CustomJS, Div, ForceDirectedLayoutProvider,
                          GraphDataSource, GraphRenderer, GraphSelectionPolicy,
                          HoverTool, TapTool)
from bokeh.plotting import figure, show

nodes = [
    {"id": f"{team}{member}", "team": team, "color": color}
    for team, color in (("A", "#4c78a8"), ("B", "#f58518"), ("C", "#54a24b"))
    for member in range(1, 4)
]
edges = [
    ("A1", "A2"), ("A2", "A3"), ("A3", "A1"),
    ("B1", "B2"), ("B2", "B3"), ("B3", "B1"),
    ("C1", "C2"), ("C2", "C3"), ("C3", "C1"),
    ("A3", "B1"), ("B3", "C1"), ("C3", "A1"),
]

source = GraphDataSource(
    nodes=nodes,
    edges=edges,
    selection_policy=GraphSelectionPolicy(node_hops=1, include_incident_edges=True),
)
graph = GraphRenderer(
    data_source=source,
    layout_provider=ForceDirectedLayoutProvider(seed=1, iterations=200),
)

graph.node_renderer.glyph.update(size=22, fill_color="color", line_color="white", line_width=2)
graph.node_renderer.selection_glyph = graph.node_renderer.glyph.clone(
    size=27, line_color="#172b4d", line_width=3,
)
graph.node_renderer.nonselection_glyph = graph.node_renderer.glyph.clone(fill_alpha=0.25, line_alpha=0.25)
graph.edge_renderer.glyph.update(line_color="#6b7280", line_alpha=0.55, line_width=2)
graph.edge_renderer.selection_glyph = graph.edge_renderer.glyph.clone(line_alpha=1, line_color="#f28e2b", line_width=4)
graph.edge_renderer.nonselection_glyph = graph.edge_renderer.glyph.clone(line_alpha=0.12)

p = figure(
    width=650,
    height=650,
    sizing_mode="stretch_width",
    max_width=700,
    x_range=(-1.18, 1.18),
    y_range=(-1.18, 1.18),
    tools="pan,wheel_zoom,reset",
    active_scroll="wheel_zoom",
    title="Three connected communities laid out in the browser",
    background_fill_color="#f7f9fc",
    outline_line_color="#d9e1ea",
)
p.axis.visible = False
p.grid.visible = False
p.renderers.append(graph)

tap = TapTool(renderers=[graph])
hover = HoverTool(renderers=[graph], tooltips=[("Node", "@index"), ("Team", "@team")])
p.add_tools(tap, hover)
p.toolbar.active_tap = tap

header = Div(sizing_mode="stretch_width", max_width=700, text="""
<h2 style="margin: 0 0 0.35em">Explore a browser-computed network</h2>
<p style="margin: 0">Python supplies nine node records and twelve undirected
edges—no coordinates. BokehJS arranges the three connected communities. Click
a node to expand the selection to its one-hop neighbors and incident edges.</p>
""")
status = Div(sizing_mode="stretch_width", max_width=700, text="<b>Current selection:</b> no nodes or edges")
callback = CustomJS(args=dict(nodes=source.nodes, edges=source.edges, status=status), code="""
    const node_ids = nodes.get("index")
    const starts = edges.get("start")
    const ends = edges.get("end")
    const selected_nodes = nodes.selected.indices.map((i) => node_ids[i])
    const selected_edges = edges.selected.indices.map((i) => `${starts[i]} — ${ends[i]}`)
    const text = (values) => values.length != 0 ? values.join(", ") : "none"
    status.text = `<b>Current selection:</b> nodes ${text(selected_nodes)} ` +
        `&nbsp;|&nbsp; edges ${text(selected_edges)}`
""")
source.nodes.selected.js_on_change("indices", callback)
source.edges.selected.js_on_change("indices", callback)

show(column(header, p, status, sizing_mode="stretch_width", max_width=700))
