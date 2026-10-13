"""
Zachary's Karate Club graph
Data file from:
http://vlado.fmf.uni-lj.si/pub/networks/data/Ucinet/UciData.htm
Reference:
Zachary W. (1977).
An information flow model for conflict and fission in small groups.
Journal of Anthropological Research, 33, 452-473.
"""

import networkx as nx

from bokeh.io import show
from bokeh.models import (BoxSelectTool, Column, Div, GraphSelectionPolicy,
                          HoverTool, MultiLine, Plot, Range1d, Row, Scatter,
                          TapTool)
from bokeh.plotting import from_networkx

G = nx.karate_club_graph()
graph_layout = nx.spring_layout(G, seed=42, scale=1, center=(0, 0))

club_colors = {
    "Mr. Hi": "#3b82f6",
    "Officer": "#f97316",
}


def create_graph(title, *, selection_policy=None, inspection_policy=None,
        selection_target="nodes", inspection_target="nodes"):

    plot = Plot(
        title=title, width=360, height=330,
        x_range=Range1d(-1.15, 1.15), y_range=Range1d(-1.15, 1.15),
        min_border=12, background_fill_color="#f8fafc", outline_line_color=None,
    )
    plot.title.text_font_size = "13px"
    plot.title.text_color = "#334155"
    plot.toolbar.logo = None

    graph_renderer = from_networkx(G, graph_layout)
    nodes = graph_renderer.node_renderer.data_source
    nodes.data["color"] = [club_colors[club] for club in nodes.data["club"]]

    node = Scatter(size=13, fill_color="color", line_color="white", line_width=1.5)
    graph_renderer.node_renderer.glyph = node
    graph_renderer.node_renderer.selection_glyph = node.clone(
        fill_color="#facc15", line_color="#713f12", line_width=2,
    )
    graph_renderer.node_renderer.nonselection_glyph = node.clone(fill_alpha=0.2, line_alpha=0.2)
    graph_renderer.node_renderer.hover_glyph = node.clone(
        fill_color="#22d3ee", line_color="#155e75", line_width=2,
    )

    edge = MultiLine(line_color="#64748b", line_alpha=0.35, line_width=1.5)
    graph_renderer.edge_renderer.glyph = edge
    graph_renderer.edge_renderer.selection_glyph = edge.clone(
        line_color="#eab308", line_alpha=0.95, line_width=3,
    )
    graph_renderer.edge_renderer.nonselection_glyph = edge.clone(line_alpha=0.06)
    graph_renderer.edge_renderer.hover_glyph = edge.clone(
        line_color="#0891b2", line_alpha=0.95, line_width=3,
    )

    graph_renderer.selection_target = selection_target
    graph_renderer.inspection_target = inspection_target
    if selection_policy is not None:
        graph_renderer.data_source.selection_policy = selection_policy
    if inspection_policy is not None:
        graph_renderer.inspection_policy = inspection_policy

    plot.renderers.append(graph_renderer)

    return plot


hover_incident = create_graph(
    "Hover node → incident edges",
    inspection_policy=GraphSelectionPolicy(include_incident_edges=True),
)
hover_incident.add_tools(HoverTool(tooltips=[("Node", "@index"), ("Club", "@club")]))

hover_endpoints = create_graph(
    "Hover edge → end nodes",
    inspection_policy=GraphSelectionPolicy(include_end_nodes=True),
    inspection_target="edges",
)
hover_endpoints.add_tools(HoverTool(tooltips=[("Edge", "@start → @end")]))

hover_neighbors = create_graph(
    "Hover node → one-hop neighbors",
    inspection_policy=GraphSelectionPolicy(node_hops=1),
)
hover_neighbors.add_tools(HoverTool(tooltips=[("Node", "@index"), ("Club", "@club")]))

select_incident = create_graph(
    "Select node → incident edges",
    selection_policy=GraphSelectionPolicy(include_incident_edges=True),
)
select_incident.add_tools(TapTool(), BoxSelectTool())

select_endpoints = create_graph(
    "Select edge → end nodes",
    selection_policy=GraphSelectionPolicy(include_end_nodes=True),
    selection_target="edges",
)
select_endpoints.add_tools(TapTool())

select_two_hops = create_graph(
    "Select node → exactly two hops",
    selection_policy=GraphSelectionPolicy(node_hops=2, node_hops_mode="exact", include_direct=False),
)
select_two_hops.add_tools(TapTool())

intro = Div(text="""
<h2 style="margin: 0 0 0.25em">Zachary's Karate Club</h2>
<p style="margin: 0 0 0.8em; color: #475569">
Every panel uses the same graph and layout so each policy can be compared directly.
Blue and orange nodes show the club's two factions; cyan marks inspection and yellow marks selection.
</p>
""", width=1120)

layout = Column(
    intro,
    Row(hover_incident, hover_endpoints, hover_neighbors, spacing=14),
    Row(select_incident, select_endpoints, select_two_hops, spacing=14),
    spacing=14,
)
show(layout)
