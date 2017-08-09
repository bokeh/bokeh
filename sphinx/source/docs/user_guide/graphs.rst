.. _userguide_graphs:

Visualizing Network Graphs
==========================

Bokeh has added native support for creating network graph visualizations with
configurable interactions between edges and nodes.

Edge and Node Renderers
-----------------------

The secret sauce of the new GraphRenderer is that it maintains separate
sub-GlyphRenderers for the graph nodes and the graph edges. This allows for
customizing the nodes by modifying the GraphRenderer's ``node_renderer``
property. It's even possible to replace the default Circle node glyph with any
XYGlyph instance, for example a Rect or Oval glyph. Similarly, the style
properties of the edges can modified through the ``edge_renderer`` property.
The edge glyph, however, is currently limited to a MultiLine glyph.

There are a couple requirements for the data sources belonging to these
sub-renderers:
* The ColumnDataSource associated with the node sub-renderer must have a column
named ``"index"`` that contains the unique indices of the nodes.
* The ColumnDataSource associated with the edge sub-renderer has two required
columns: ``"start"`` and ``"end"``. These columns contain the node indices of
for the start and end of the edges.

It's possible to add extra meta-data to these data sources to in order to
add vectorized glyph styling or make data available for callbacks or hover
tooltips.

Here's a code snippet that:

- replaces the node glyph with an Oval
- sets the ``height`` and ``width`` attributes of the Oval as scalar values
- sets the ``fill_color`` attribute of the Oval as a vectorized field and adds the values to the node data source.

.. code-block:: python

    import math

    from bokeh.models import GraphRenderer, Oval
    from bokeh.palettes import Spectral8

    N = 8
    node_indices = list(range(N))

    plot = figure(title="Graph Layout Demonstration", x_range=(-1.1,1.1), y_range=(-1.1,1.1),
                  tools="", toolbar_location=None)

    graph = GraphRenderer()

    graph.node_renderer.glyph = Oval(height=0.1, width=0.2, fill_color="fill_color")
    graph.node_renderer.data_source.data = dict(
        index=node_indices,
        fill_color=Spectral8)

    graph.edge_renderer.data_source.data = dict(
        start=[0]*N,
        end=node_indices)


No graph will be rendered by running the above code snippet because we haven't
specified how to arrange the graph in 2D space. You can learn how to do that
in the following section.

Layout Providers
----------------

Bokeh uses a separate LayoutProvider model in order to supply the coordinates
of a graph in Cartesian space. Currently the only built-in provider is the
StaticLayoutProvider model, which contains a dictionary of (x,y) coordinates
for the nodes.

This example adds a provider to the above code snippet:

.. bokeh-plot::
    :source-position: above

    import math

    from bokeh.io import show, output_file
    from bokeh.plotting import figure
    from bokeh.models import GraphRenderer, StaticLayoutProvider, Oval
    from bokeh.palettes import Spectral8

    N = 8
    node_indices = list(range(N))

    plot = figure(title="Graph Layout Demonstration", x_range=(-1.1,1.1), y_range=(-1.1,1.1),
                  tools="", toolbar_location=None)

    graph = GraphRenderer()

    graph.node_renderer.glyph = Oval(height=0.1, width=0.2, fill_color="fill_color")
    graph.node_renderer.data_source.data = dict(
        index=node_indices,
        fill_color=Spectral8)

    graph.edge_renderer.data_source.data = dict(
        start=[0]*N,
        end=node_indices)

    ### start of new code

    circ = [i*2*math.pi/8 for i in node_indices]
    x = [math.cos(i) for i in circ]
    y = [math.sin(i) for i in circ]

    graph_layout = dict(zip(node_indices, zip(x, y)))
    graph.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

    plot.renderers.append(graph)

    output_file("graph.html")
    show(plot)

Networkx Integration
--------------------

Bokeh supports quickly plotting a network graph with its networkx integration.
The ``bokeh.models.graphs.from_networkx`` convenience method accepts a
``networkx.Graph`` object and a networkx layout method in order to return a
configured GraphRenderer instance.

Here is an example of using the ``networkx.spring_layout`` method to
layout networkx's built-in "Zachary's Karate Club graph" dataset:

.. bokeh-plot::
    :source-position: above

    import networkx as nx

    from bokeh.io import show, output_file
    from bokeh.plotting import figure
    from bokeh.models.graphs import from_networkx

    G=nx.karate_club_graph()

    plot = figure(title="Networkx Integration Demonstration", x_range=(-1.1,1.1), y_range=(-1.1,1.1),
                  tools="", toolbar_location=None)

    graph = from_networkx(G, nx.spring_layout, scale=2, center=(0,0))
    plot.renderers.append(graph)

    output_file("networkx_graph.html")
    show(plot)

Interaction Policies
--------------------

It's possible to configure the selection or inspection behavior of graphs by
setting the GraphRenderer's ``selection_policy`` and ``inspection_policy``
attributes. These policy attributes accept a special ``GraphHitTestPolicy``
model instance.

For example, setting ``selection_policy=NodesAndLinkedEdges()`` will cause
a selected node to also select the associated edges. Similarly, setting
``inspection_policy=EdgesAndLinkedNodes()`` will cause the start and end nodes
of an edge to also be inspected upon hovering an edge with the HoverTool.

Users may want to customize the ``selection_glyph``, ``nonselection_glyph``,
and/or ``hover_glyph`` attributes of the edge and node sub-renderers in order
to add dynamic visual elements to their graph interactions.

Here's a graph example with added node and edge interactions:

.. bokeh-plot::
    :source-position: above

    import networkx as nx

    from bokeh.io import show, output_file
    from bokeh.models import Plot, Range1d, MultiLine, Circle, HoverTool, TapTool, BoxSelectTool
    from bokeh.models.graphs import from_networkx, NodesAndLinkedEdges, EdgesAndLinkedNodes
    from bokeh.palettes import Spectral4

    G=nx.karate_club_graph()

    plot = Plot(plot_width=400, plot_height=400,
                x_range=Range1d(-1.1,1.1), y_range=Range1d(-1.1,1.1))
    plot.title.text = "Graph Interaction Demonstration"

    plot.add_tools(HoverTool(tooltips=None), TapTool(), BoxSelectTool())

    graph_renderer = from_networkx(G, nx.circular_layout, scale=1, center=(0,0))

    graph_renderer.node_renderer.glyph = Circle(size=15, fill_color=Spectral4[0])
    graph_renderer.node_renderer.selection_glyph = Circle(size=15, fill_color=Spectral4[2])
    graph_renderer.node_renderer.hover_glyph = Circle(size=15, fill_color=Spectral4[1])

    graph_renderer.edge_renderer.glyph = MultiLine(line_color="#CCCCCC", line_alpha=0.8, line_width=5)
    graph_renderer.edge_renderer.selection_glyph = MultiLine(line_color=Spectral4[2], line_width=5)
    graph_renderer.edge_renderer.hover_glyph = MultiLine(line_color=Spectral4[1], line_width=5)

    graph_renderer.selection_policy = NodesAndLinkedEdges()
    graph_renderer.inspection_policy = EdgesAndLinkedNodes()

    plot.renderers.append(graph_renderer)

    output_file("interactive_graphs.html")
    show(plot)
