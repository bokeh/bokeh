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

from bokeh.io import curdoc, show
from bokeh.models import (BoxSelectTool, Circle, Column, EdgesAndLinkedNodes, HoverTool,
                          MultiLine, NodesAndLinkedEdges, Plot, Range1d, Row, TapTool,)
from bokeh.palettes import Spectral4
from bokeh.plotting import from_networkx

G = nx.karate_club_graph()

def create_graph(layout_func, inspection_policy=None, selection_policy=None, **kwargs):

    plot = Plot(plot_width=400, plot_height=400,
                x_range=Range1d(-1.1,1.1), y_range=Range1d(-1.1,1.1))
    graph_renderer = from_networkx(G, layout_func, **kwargs)

    graph_renderer.node_renderer.glyph = Circle(size=15, fill_color=Spectral4[0])
    graph_renderer.node_renderer.selection_glyph = Circle(size=15, fill_color=Spectral4[2])
    graph_renderer.node_renderer.hover_glyph = Circle(size=15, fill_color=Spectral4[1])

    graph_renderer.edge_renderer.glyph = MultiLine(line_color="#CCCCCC", line_alpha=0.8, line_width=5)
    graph_renderer.edge_renderer.selection_glyph = MultiLine(line_color=Spectral4[2], line_width=5)
    graph_renderer.edge_renderer.hover_glyph = MultiLine(line_color=Spectral4[1], line_width=5)

    if inspection_policy is not None:
        graph_renderer.inspection_policy = inspection_policy
    if selection_policy is not None:
        graph_renderer.selection_policy = selection_policy

    plot.renderers.append(graph_renderer)

    return plot

plot_1 = create_graph(nx.circular_layout, inspection_policy=NodesAndLinkedEdges(), scale=1, center=(0,0))
plot_1.title.text = "Circular Layout (NodesAndLinkedEdges inspection policy)"
plot_1.add_tools(HoverTool(tooltips=None))

plot_2 = create_graph(nx.spring_layout, selection_policy=NodesAndLinkedEdges(), scale=2, center=(0,0))
plot_2.title.text = "Spring Layout (NodesAndLinkedEdges selection policy)"
plot_2.add_tools(TapTool(), BoxSelectTool())

plot_3 = create_graph(nx.random_layout, inspection_policy=EdgesAndLinkedNodes(), center=(0,0))
plot_3.title.text = "Random Layout (EdgesAndLinkedNodes inspection policy)"
plot_3.add_tools(HoverTool(tooltips=None))

plot_4 = create_graph(nx.fruchterman_reingold_layout, selection_policy=EdgesAndLinkedNodes(), scale=2, center=(0,0), dim=2)
plot_4.title.text = "FR Layout (EdgesAndLinkedNodes selection policy)"
plot_4.add_tools(TapTool())

layout = Column(Row(plot_1, plot_2), Row(plot_3, plot_4))

doc = curdoc()
doc.add_root(layout)

show(layout)
