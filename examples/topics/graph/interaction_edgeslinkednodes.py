import networkx as nx

from bokeh.models import (BoxSelectTool, EdgesAndLinkedNodes, HoverTool,
                          MultiLine, Plot, Range1d, Scatter, TapTool)
from bokeh.palettes import Spectral4
from bokeh.plotting import from_networkx, show

G = nx.karate_club_graph()

plot = Plot(width=400, height=400,
            x_range=Range1d(-1.1,1.1), y_range=Range1d(-1.1,1.1))
plot.title.text = "Graph Interaction Demonstration"

plot.add_tools(HoverTool(tooltips=None), TapTool(), BoxSelectTool())

graph_renderer = from_networkx(G, nx.circular_layout, scale=1, center=(0,0))

graph_renderer.node_renderer.glyph = Scatter(size=15, fill_color=Spectral4[0])
graph_renderer.node_renderer.selection_glyph = Scatter(size=15, fill_color=Spectral4[2])
graph_renderer.node_renderer.hover_glyph = Scatter(size=15, fill_color=Spectral4[1])

graph_renderer.edge_renderer.glyph = MultiLine(line_color="#CCCCCC", line_alpha=0.8, line_width=5)
graph_renderer.edge_renderer.selection_glyph = MultiLine(line_color=Spectral4[2], line_width=5)
graph_renderer.edge_renderer.hover_glyph = MultiLine(line_color=Spectral4[1], line_width=5)

graph_renderer.selection_policy = EdgesAndLinkedNodes()
graph_renderer.inspection_policy = EdgesAndLinkedNodes()

plot.renderers.append(graph_renderer)

show(plot)
