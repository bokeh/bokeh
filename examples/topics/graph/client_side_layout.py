''' A graph using a dependency-free layout computed in BokehJS.

.. bokeh-example-metadata::
    :apis: bokeh.models.BezierEdgePathProvider, bokeh.models.GraphDataSource, bokeh.models.ForceDirectedLayoutProvider, bokeh.models.GraphSelectionPolicy
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, layout, force-directed, selection
'''

from bokeh.layouts import column
from bokeh.models import (BezierEdgePathProvider, CustomJS, Div,
                          ForceDirectedLayoutProvider, GraphDataSource, GraphRenderer,
                          GraphSelectionPolicy, HoverTool, TapTool)
from bokeh.plotting import figure, show

nodes = [
    {"id": "A", "color": "#4c78a8"},
    {"id": "B", "color": "#f58518"},
    {"id": "C", "color": "#e45756"},
    {"id": "D", "color": "#72b7b2"},
    {"id": "E", "color": "#54a24b"},
    {"id": "F", "color": "#eeca3b"},
]
edges = [
    ("A", "B", {"curvature": 0.16}),
    ("A", "C", {"curvature": -0.12}),
    ("B", "C", {"curvature": 0.1}),
    ("C", "D", {"curvature": -0.08}),
    ("D", "E", {"curvature": 0.14}),
    ("D", "F", {"curvature": -0.16}),
    ("E", "F", {"curvature": 0.1}),
]

source = GraphDataSource(
    nodes=nodes,
    edges=edges,
    selection_policy=GraphSelectionPolicy(include_incident_edges=True),
)
graph = GraphRenderer(
    data_source=source,
    layout_provider=ForceDirectedLayoutProvider(seed=11, iterations=150),
    edge_path_provider=BezierEdgePathProvider(curvature="curvature", steps=20),
)

graph.node_renderer.glyph.update(size=18, fill_color="color", line_color="white")
graph.node_renderer.selection_glyph = graph.node_renderer.glyph.clone(
    size=22, fill_color="#f28e2b", line_color="#9a4d00", line_width=2,
)
graph.node_renderer.nonselection_glyph = graph.node_renderer.glyph.clone(fill_alpha=0.25, line_alpha=0.25)
graph.edge_renderer.glyph.update(line_alpha=0.45, line_width=2)
graph.edge_renderer.selection_glyph = graph.edge_renderer.glyph.clone(line_alpha=1, line_color="#f28e2b", line_width=4)
graph.edge_renderer.nonselection_glyph = graph.edge_renderer.glyph.clone(line_alpha=0.12)

p = figure(
    width=700,
    height=500,
    sizing_mode="scale_width",
    max_width=700,
    x_range=(-1.2, 1.2),
    y_range=(-1.2, 1.2),
    tools="pan,wheel_zoom,reset",
    active_scroll="wheel_zoom",
    title="Client-side force-directed layout of an undirected graph",
)
p.renderers.append(graph)

tap = TapTool(renderers=[graph])
hover = HoverTool(renderers=[graph], tooltips=[("Node", "@index")])
p.add_tools(tap, hover)
p.toolbar.active_tap = tap

header = Div(sizing_mode="stretch_width", max_width=700, text="""
<h2 style="margin: 0 0 0.35em">A browser-computed graph layout</h2>
<p style="margin: 0">The force-directed positions and curved paths are computed
without third-party JavaScript. Connections are treated as undirected. Click a
node to select it and every edge touching it; hover only identifies the node.</p>
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
