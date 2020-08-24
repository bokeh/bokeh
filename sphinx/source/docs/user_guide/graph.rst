.. _userguide_graph:

Visualizing Network Graphs
==========================

Bokeh has added native support for creating network graph visualizations with
configurable interactions between edges and nodes.

Edge and Node Renderers
-----------------------

The key feature of the ``GraphRenderer`` is that it maintains separate
sub-GlyphRenderers for the graph nodes and the graph edges. This allows for
customizing the nodes by modifying the GraphRenderer's ``node_renderer``
property. It's possible to replace the default Circle node glyph with any
XYGlyph instance, for example a Rect or Ellipse glyph. Similarly, the style
properties of the edges can be modified through the ``edge_renderer`` property.
The edge glyph is currently limited to a MultiLine glyph.

There are a couple of requirements for the data sources belonging to these
sub-renderers:

- The ColumnDataSource associated with the node sub-renderer must have a column
  named ``"index"`` that contains the unique indices of the nodes.
- The ColumnDataSource associated with the edge sub-renderer has two required
  columns: ``"start"`` and ``"end"``. These columns contain the node indices
  for the start and end of the edges.

It's possible to add extra meta-data to these data sources to in order to
add vectorized glyph styling or make data available for callbacks or hover
tooltips.

Here's a code snippet that:

- replaces the node glyph with an Ellipse
- sets the ``height`` and ``width`` attributes of the Ellipse as scalar values
- sets the ``fill_color`` attribute of the Ellipse as a vectorized field and adds
  the values to the node data source.

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


No graph will be rendered by running the above code snippet because we haven't
specified how to arrange the graph in 2D space. You can learn how to do that
in the following section.

Layout Providers
----------------

Bokeh uses a separate ``LayoutProvider`` model in order to supply the coordinates
of a graph in Cartesian space. Currently, the only built-in provider is the
:class:`~bokeh.models.graphs.StaticLayoutProvider` model, which contains a
dictionary of (x,y) coordinates for the nodes.

This example adds a provider to the above code snippet:

.. bokeh-plot:: docs/user_guide/examples/graph_customize.py
    :source-position: above

Explicit Paths
--------------

By default, the :class:`~bokeh.models.graphs.StaticLayoutProvider` will
draw straight-line paths between the supplied node positions. In order
to supply explicit edge paths, you may also supply lists of paths to
the ``edge_renderer``
:class:`bokeh.models.sources.ColumnDataSource`. The
:class:`~bokeh.models.graphs.StaticLayoutProvider` will look for these
paths on the ``"xs"`` and ``"ys"`` columns of the data source. Note
that these paths should be in the same order as the ``"start"`` and
``"end"`` points. Also note that there is no validation that they
match up with the node positions, so be extra careful when setting
explicit paths.

This example extends the example from above to draw quadratic bezier
paths between the nodes:

.. bokeh-plot:: docs/user_guide/examples/graph_static_paths.py
    :source-position: above

Networkx Integration
--------------------

Bokeh supports quickly plotting a network graph with its networkx integration.
The ``bokeh.plotting.from_networkx`` convenience method accepts a
``networkx.Graph`` object and a networkx layout method in order to return a
configured GraphRenderer instance.

Here is an example of using the ``networkx.spring_layout`` method to
layout networkx's built-in "Zachary's Karate Club graph" dataset:

.. bokeh-plot:: docs/user_guide/examples/graph_networkx.py
    :source-position: above

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

.. bokeh-plot:: docs/user_guide/examples/graph_interaction.py
    :source-position: above

Node and Edge Attributes
------------------------

In ``from_networkx``, NetworkX's node/edge attributes are converted for
GraphRenderer's ``node_renderer``/``edge_renderer``.

For example, "Zachary's Karate Club graph" dataset has a node attribute named
"club". It's possible to hover this information using the node attributes
converted in ``from_networkx``. Similarly, node/edge attributes can also be
used for color information.

Here’s a graph example that hovers node attributes and changes colors with
edge attributes:

.. bokeh-plot:: docs/user_guide/examples/graph_node_and_edge_attributes.py
    :source-position: above
