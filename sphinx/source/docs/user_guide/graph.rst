.. _userguide_graph:

Visualizing network graphs
==========================

Bokeh lets you create network graph visualizations and configure
interactions between edges and nodes.

Edge and node renderers
-----------------------

The ``GraphRenderer`` model maintains separate sub-``GlyphRenderers``
for graph nodes and edges. This lets you customize nodes by modifying
the ``node_renderer`` property of the ``GraphRenderer``. You can replace
the default Circle node glyph with any instance of the XYGlyph such as
Rect or Ellipse glyph. You can similarly modify the style properties
of edges through the ``edge_renderer`` property. To work with edge
glyphs, use the ``multi_line`` glyph method.

Observe the following requirements for the data sources belonging
to these sub-renderers:

- The ``ColumnDataSource`` of the node sub-renderer must have an
  ``"index"`` column with the unique indices of the nodes.
- The ``ColumnDataSource`` of the edge sub-renderer must have a
  ``"start"`` and ``"end"`` column. These columns contain the node
  indices for the start and end of the edges.

You can add extra meta-data to these sources to enable vectorized
glyph styling or make data available for callbacks or hover tooltips.

The following code snippet

- replaces a node glyph with an Ellipse,
- assigns scalar values to the ``height`` and ``width`` attributes of the Ellipse,
- assigns a vector field to the ``fill_color`` attribute of the Ellipse,
- and adds the assigned values to the node data source.

.. code-block:: python

    import math
    from bokeh.plotting import figure
    from bokeh.models import GraphRenderer, Ellipse
    from bokeh.palettes import Spectral8

    N = 8
    node_indices = list(range(N))

    plot = figure(title="Graph Layout Demonstration", x_range=(-1.1,1.1), y_range=(-1.1,1.1),
                  tools="", toolbar_location=None)

    graph = GraphRenderer()

    graph.node_renderer.glyph = Ellipse(height=0.1, width=0.2, fill_color="fill_color")
    graph.node_renderer.data_source.data = dict(
        index=node_indices,
        fill_color=Spectral8)

    graph.edge_renderer.data_source.data = dict(
        start=[0]*N,
        end=node_indices)


This code snippet doesn't produce a graph because it lacks instructions on how
to arrange the graph in Cartesian space. You can learn how to implement these
instructions in the following section.

Layout providers
----------------

Bokeh uses a separate ``LayoutProvider`` model to provide Cartesian coordinates
for a graph. The :class:`~bokeh.models.graphs.StaticLayoutProvider` model is
currently the only built-in provider. It contains a dictionary of (x,y)
coordinates for nodes.

This example adds a provider to the above code snippet:

.. bokeh-plot:: docs/user_guide/examples/graph_customize.py
    :source-position: above

Explicit paths
--------------

By default, the :class:`~bokeh.models.graphs.StaticLayoutProvider` model
draws straight-line paths between the supplied node positions. To set
explicit edge paths, supply lists of paths to the
:class:`bokeh.models.sources.ColumnDataSource` data source of the
``edge_renderer``. The :class:`~bokeh.models.graphs.StaticLayoutProvider`
model looks for these paths in the ``"xs"`` and ``"ys"`` columns of the
data source. The paths should be in the same order as the ``"start"``
and ``"end"`` points. Be extra careful when setting
explicit paths because there is no validation to check if they match
with node positions.

The following extends the example above and draws quadratic bezier
curves between the nodes:

.. bokeh-plot:: docs/user_guide/examples/graph_static_paths.py
    :source-position: above

NetworkX integration
--------------------

Bokeh integrates the NetworkX package so you can quickly plot
network graphs. The ``bokeh.plotting.from_networkx`` convenience
method accepts a ``networkx.Graph`` object and a NetworkX layout
method and returns a configured instance of the ``GraphRenderer``
model.

Here is how the ``networkx.spring_layout`` method lays out the
"Zachary's karate club graph" data set built into NetworkX:

.. bokeh-plot:: docs/user_guide/examples/graph_networkx.py
    :source-position: above

Interaction policies
--------------------

You can configure the selection or inspection behavior of graphs by
setting the ``selection_policy`` and ``inspection_policy`` attributes
of the ``GraphRenderer``. These policy attributes accept a special
``GraphHitTestPolicy`` model instance.

For example, setting ``selection_policy`` to ``NodesAndLinkedEdges()``
lets you select a node and all associated edges. Similarly, setting
``inspection_policy`` to ``EdgesAndLinkedNodes()`` lets you inspect the
``"start"`` and ``"end"`` nodes of an edge by hovering over it with the
HoverTool.

You can customize the ``selection_glyph``, ``nonselection_glyph``,
and/or ``hover_glyph`` attributes of the edge and node sub-renderers
to add dynamic visual elements to your graph interactions.

Here is an example of a graph with added node and edge interactions:

.. bokeh-plot:: docs/user_guide/examples/graph_interaction.py
    :source-position: above

Node and edge attributes
------------------------

The ``from_networkx`` method converts node and edge attributes of the
NetworkX package for use with ``node_renderer`` and ``edge_renderer``
of the ``GraphRenderer`` model.

For example, "Zachary's karate club graph" data set has a node
attribute named "club". You can hover this information with node
attributes converted with the ``from_networkx`` method. You can
also use node and edge attributes for color information.

Here is an example of a graph that hovers node attributes and changes
colors with edge attributes:

.. bokeh-plot:: docs/user_guide/examples/graph_node_and_edge_attributes.py
    :source-position: above
