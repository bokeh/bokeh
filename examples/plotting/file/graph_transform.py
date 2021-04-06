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

from bokeh.core.properties import field
from bokeh.io import show
from bokeh.models import (BoxSelectTool, ColumnDataSource, EdgesAndLinkedNodes,
                          HoverTool, IndexTransform, NodesAndLinkedEdges, TapTool)
from bokeh.palettes import Spectral4
from bokeh.plotting import figure, gridplot

selection_color = Spectral4[2]
hover_color = Spectral4[1]

def create_graph(graph, layout, inspection_policy=None, selection_policy=None):
    plot = figure(width=400, height=400, x_range=(-1.1, 1.1), y_range=(-1.1, 1.1))

    xs, ys = zip(*layout.values())

    nodes = plot.circle(x=xs, y=ys, size=15,
      fill_color=Spectral4[0], selection_fill_color=selection_color, hover_fill_color=hover_color)

    Is, Js = zip(*G.edges())

    source = ColumnDataSource(dict(i=Is, j=Js))
    I = IndexTransform(index=field("i"), target=nodes)
    J = IndexTransform(index=field("j"), target=nodes)

    plot.segment(x0=I.x, y0=I.y, x1=J.x, y1=J.y, source=source,
      line_width=2, line_alpha=0.8, line_color="#cccccc",
      selection_line_color=selection_color, hover_line_color=hover_color)

    #if inspection_policy is not None:
    #    graph_renderer.inspection_policy = inspection_policy
    #if selection_policy is not None:
    #    graph_renderer.selection_policy = selection_policy

    return plot

G = nx.karate_club_graph()

layout_1 = nx.circular_layout(G, scale=1, center=(0, 0))
plot_1 = create_graph(G, layout_1, inspection_policy=NodesAndLinkedEdges())
plot_1.title.text = "Circular Layout (NodesAndLinkedEdges inspection policy)"
plot_1.add_tools(HoverTool(tooltips=None))

layout_2 = nx.spring_layout(G, scale=2, center=(0, 0))
plot_2 = create_graph(G, layout_2, selection_policy=NodesAndLinkedEdges())
plot_2.title.text = "Spring Layout (NodesAndLinkedEdges selection policy)"
plot_2.add_tools(TapTool(), BoxSelectTool())

layout_3 = nx.random_layout(G, center=(0, 0))
plot_3 = create_graph(G, layout_3, inspection_policy=EdgesAndLinkedNodes())
plot_3.title.text = "Random Layout (EdgesAndLinkedNodes inspection policy)"
plot_3.add_tools(HoverTool(tooltips=None))

layout_4 = nx.fruchterman_reingold_layout(G, scale=2, center=(0, 0), dim=2)
plot_4 = create_graph(G, layout_4, selection_policy=EdgesAndLinkedNodes())
plot_4.title.text = "FR Layout (EdgesAndLinkedNodes selection policy)"
plot_4.add_tools(TapTool())

grid = gridplot([[plot_1, plot_2], [plot_3, plot_4]], merge_tools=False)
show(grid)
