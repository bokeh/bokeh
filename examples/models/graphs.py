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
from bokeh.models import (BoxSelectTool, Column, GraphSelectionPolicy,
                          HoverTool, MultiLine, Plot, Range1d, Row, Scatter,
                          TapTool)
from bokeh.palettes import Spectral4
from bokeh.plotting import from_networkx

G = nx.karate_club_graph()


def create_graph(layout_func, policy=None, *, selection_target="nodes", inspection_target="nodes", **kwargs):

    plot = Plot(width=400, height=400, x_range=Range1d(-1.1, 1.1), y_range=Range1d(-1.1, 1.1))
    graph_renderer = from_networkx(G, layout_func, **kwargs)

    scatter_glyph = Scatter(size=15, fill_color=Spectral4[0])
    graph_renderer.node_renderer.glyph = scatter_glyph
    graph_renderer.node_renderer.selection_glyph = scatter_glyph.clone(fill_color=Spectral4[2])
    graph_renderer.node_renderer.hover_glyph = scatter_glyph.clone(fill_color=Spectral4[1])

    ml_glyph = MultiLine(line_color="#CCCCCC", line_alpha=0.8, line_width=5)
    graph_renderer.edge_renderer.glyph = ml_glyph
    graph_renderer.edge_renderer.selection_glyph = ml_glyph.clone(line_color=Spectral4[2], line_alpha=1)
    graph_renderer.edge_renderer.hover_glyph = ml_glyph.clone(line_color=Spectral4[1], line_alpha=1)

    graph_renderer.selection_target = selection_target
    graph_renderer.inspection_target = inspection_target
    if policy is not None:
        graph_renderer.data_source.selection_policy = policy

    plot.renderers.append(graph_renderer)

    return plot


plot_1 = create_graph(nx.circular_layout, GraphSelectionPolicy(include_incident_edges=True), scale=1, center=(0, 0))
plot_1.title.text = "Circular Layout (node inspection includes incident edges)"
plot_1.add_tools(HoverTool(tooltips=None))

plot_2 = create_graph(nx.spring_layout, GraphSelectionPolicy(include_incident_edges=True), scale=2, center=(0, 0))
plot_2.title.text = "Spring Layout (node selection includes incident edges)"
plot_2.add_tools(TapTool(), BoxSelectTool())

plot_3 = create_graph(nx.random_layout, GraphSelectionPolicy(include_end_nodes=True), inspection_target="edges", center=(0, 0))
plot_3.title.text = "Random Layout (edge inspection includes endpoints)"
plot_3.add_tools(HoverTool(tooltips=None))

plot_4 = create_graph(
    nx.fruchterman_reingold_layout, GraphSelectionPolicy(include_end_nodes=True),
    selection_target="edges", scale=2, center=(0, 0), dim=2,
)
plot_4.title.text = "FR Layout (edge selection includes endpoints)"
plot_4.add_tools(TapTool())

plot_5 = create_graph(nx.circular_layout, GraphSelectionPolicy(node_hops=1), scale=1, center=(0, 0))
plot_5.title.text = "Circular Layout (one-hop node inspection)"
plot_5.add_tools(HoverTool(tooltips=None))

plot_6 = create_graph(
    nx.fruchterman_reingold_layout,
    GraphSelectionPolicy(node_hops=2, node_hops_mode="exact", include_direct=False),
    scale=2, center=(0, 0), dim=2,
)
plot_6.title.text = "FR Layout (exactly two hops from selected node)"
plot_6.add_tools(TapTool())

layout = Column(Row(plot_1, plot_2), Row(plot_3, plot_4), Row(plot_5, plot_6))
show(layout)
