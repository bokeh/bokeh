''' A graph using a dependency-free layout computed in BokehJS.

.. bokeh-example-metadata::
    :apis: bokeh.models.BezierEdgePathProvider, bokeh.models.GraphDataSource, bokeh.models.ForceDirectedLayoutProvider, bokeh.models.GraphSelectionPolicy
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, layout, force-directed, selection
'''

from bokeh.models import BezierEdgePathProvider, ForceDirectedLayoutProvider, GraphDataSource, GraphRenderer, GraphSelectionPolicy
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
    selection_policy=GraphSelectionPolicy(node_hops=1, include_incident_edges=True),
)
graph = GraphRenderer(
    data_source=source,
    layout_provider=ForceDirectedLayoutProvider(seed=11, iterations=150),
    edge_path_provider=BezierEdgePathProvider(curvature="curvature", steps=20),
)

graph.node_renderer.glyph.update(size=18, fill_color="color", line_color="white")
graph.node_renderer.selection_glyph = graph.node_renderer.glyph.clone(size=22, line_color="black")
graph.edge_renderer.glyph.update(line_alpha=0.45, line_width=2)
graph.edge_renderer.selection_glyph = graph.edge_renderer.glyph.clone(line_alpha=1, line_color="#d62728")

p = figure(
    width=700,
    height=500,
    x_range=(-1.2, 1.2),
    y_range=(-1.2, 1.2),
    tools="pan,wheel_zoom,tap,reset",
    active_scroll="wheel_zoom",
    title="Client-side force-directed graph layout",
)
p.renderers.append(graph)

show(p)
