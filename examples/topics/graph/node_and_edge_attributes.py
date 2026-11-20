''' Style NetworkX graph glyphs with attributes from the node and edge sources.

.. bokeh-example-metadata::
    :title: Karate club ties
    :keywords: graph, hover, networkx, tooltip
    :apis: bokeh.plotting.from_networkx
    :refs: :ref:`ug_topics_graph`
    :gallery: Blue and orange clusters in Zachary's karate club graph, with cross-club edges accented in pink.

'''

import networkx as nx

from bokeh.layouts import column
from bokeh.models import Div, HoverTool, MultiLine, Scatter
from bokeh.plotting import figure, from_networkx, show

club_colors = {"Mr. Hi": "#2563eb", "Officer": "#b45309"}
cross_club_color = "#a62c70"

network = nx.karate_club_graph()
for _, attrs in network.nodes(data=True):
    attrs["color"] = club_colors[attrs["club"]]
for start, end, attrs in network.edges(data=True):
    same_club = network.nodes[start]["club"] == network.nodes[end]["club"]
    attrs["color"] = "#a1abb9" if same_club else cross_club_color
    attrs["width"] = 1.2 if same_club else 2.2

graph = from_networkx(network, nx.spring_layout, seed=42)
node = Scatter(size=15, fill_color="color", line_color="white", line_width=1.5)
graph.node_renderer.glyph = node
graph.node_renderer.hover_glyph = node.clone(size=21, line_width=2)
graph.edge_renderer.glyph = MultiLine(line_color="color", line_width="width", line_alpha=0.7)

p = figure(
    title="Zachary's karate club", width=650, height=490,
    x_range=(-1.28, 1.28), y_range=(-1.2, 1.2),
    x_axis_location=None, y_axis_location=None, tools="", toolbar_location=None,
    background_fill_color="#f8fafc", outline_line_color=None,
)
p.grid.visible = False
p.add_tools(HoverTool(renderers=[graph], tooltips=[("Member", "@index"), ("Club", "@club")]))
p.renderers.append(graph)

key = Div(width=650, text=f"""
<b style="color:{club_colors['Mr. Hi']}">Mr. Hi</b> &nbsp;·&nbsp;
<b style="color:{club_colors['Officer']}">Officer</b> &nbsp;·&nbsp;
<b style="color:{cross_club_color}">Cross-club ties</b>
""")
show(column(p, key))
