''' Select every node within two hops of a directly selected node.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphSelectionPolicy, bokeh.plotting.from_networkx
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, selection, traversal, hops
'''

import networkx as nx

from bokeh.models import GraphSelectionPolicy
from bokeh.plotting import figure, from_networkx, show

graph = nx.karate_club_graph()

p = figure(
    title="Select a node to reveal its two-hop neighborhood",
    width=650,
    height=650,
    x_range=(-1.1, 1.1),
    y_range=(-1.1, 1.1),
    tools="tap,reset",
    toolbar_location="above",
)

renderer = from_networkx(graph, nx.spring_layout, seed=7, scale=1, center=(0, 0))
renderer.data_source.selection_policy = GraphSelectionPolicy(
    node_hops=2,
    node_hops_mode="up_to",
)
renderer.node_renderer.glyph.update(size=14, fill_color="#4c78a8")
renderer.node_renderer.selection_glyph = renderer.node_renderer.glyph.clone(
    size=18,
    fill_color="#f58518",
)

p.renderers.append(renderer)

show(p)
