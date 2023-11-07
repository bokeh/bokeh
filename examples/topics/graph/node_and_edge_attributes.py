''' A demonstration of NetworkX integration for drawing network graphs.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.from_networkx
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, hover, networkx, tooltip

'''
import networkx as nx

from bokeh.models import MultiLine, Scatter
from bokeh.plotting import figure, from_networkx, show

G = nx.karate_club_graph()

SAME_CLUB_COLOR, DIFFERENT_CLUB_COLOR = "darkgrey", "red"

edge_attrs = {}
for start_node, end_node, _ in G.edges(data=True):
    edge_color = SAME_CLUB_COLOR if G.nodes[start_node]["club"] == G.nodes[end_node]["club"] else DIFFERENT_CLUB_COLOR
    edge_attrs[(start_node, end_node)] = edge_color

nx.set_edge_attributes(G, edge_attrs, "edge_color")

plot = figure(width=400, height=400, x_range=(-1.2, 1.2), y_range=(-1.2, 1.2),
              x_axis_location=None, y_axis_location=None, toolbar_location=None,
              title="Graph Interaction Demo", background_fill_color="#efefef",
              tooltips="index: @index, club: @club")
plot.grid.grid_line_color = None

graph_renderer = from_networkx(G, nx.spring_layout, scale=1, center=(0, 0))
graph_renderer.node_renderer.glyph = Scatter(size=15, fill_color="lightblue")
graph_renderer.edge_renderer.glyph = MultiLine(line_color="edge_color",
                                               line_alpha=1, line_width=2)
plot.renderers.append(graph_renderer)

show(plot)
