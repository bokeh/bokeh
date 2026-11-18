.. _ug_topics_graph:

Network graphs
==============

Bokeh lets you create network graph visualizations and configure
interactions between edges and nodes.

Overview
--------

Graph drawing is done using the ``GraphRenderer`` model.

A :class:`~bokeh.models.GraphDataSource` holds separate indexed sources for the
nodes and edges. Set it on ``GraphRenderer.data_source``. The renderer uses its
two child sources as the data sources of ``node_renderer`` and
``edge_renderer``. Configure their glyphs independently and use
``layout_provider`` to set the layout.

You can pass existing indexed sources, column mappings, or node and edge
records. In raw inputs, ``id`` can fill in for a missing ``index``, and
``source`` and ``target`` can fill in for missing ``start`` and ``end`` fields.
When a canonical field is present, the alias remains an ordinary attribute.

.. code-block:: python

    from bokeh.models import GraphDataSource, GraphRenderer, StaticLayoutProvider

    source = GraphDataSource(nodes=[{"id": "A"}, {"id": "B"}], edges=[("A", "B")])
    layout = StaticLayoutProvider(graph_layout={"A": (0, 0), "B": (1, 1)})
    graph = GraphRenderer(data_source=source, layout_provider=layout)

While the positions of the nodes could theoretically be stored in the ``node_renderer``,
this approach allows for more flexibility. The same graph data can be viewed differently
depending on the ``layout_provider``, which will dictate the placement of the nodes.


Edge and node renderers
-----------------------

By default, the glyph used in ``node_renderer`` is ``Scatter``.
You can replace it by any instance of ``XYGlyph``, like ``Ellipse``, ``Rect`` or even
:class:`~bokeh.models.Scatter`.

Similarly, you can modify the style properties
of edges through the ``edge_renderer`` property. Supported edge glyphs are ``MultiLine``, ``Patches``, ``Segment``, and ``Bezier``.
Choose the edge glyph before displaying the graph. Supply custom child
renderers at construction time and update the sources through their normal
data APIs.

The node and edge sources expose these topology fields:

* The node source has an ``"index"`` field with unique node identifiers.
* The edge source has ``"start"`` and ``"end"`` fields containing the node
  identifiers at each end of the edge.

You can add extra meta-data to these sources to enable vectorized
glyph styling or make data available for callbacks or hover tooltips.

The bike network below uses an ``Ellipse`` glyph with a fixed width and
height, and takes its fill colors from the node source. A ``MultiLine``
glyph styles the connections. ``StaticLayoutProvider`` supplies node
positions by identifier.

.. bokeh-plot:: __REPO__/examples/topics/graph/graph_customize.py
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

The following example supplies explicit quadratic Bézier paths between nodes:

.. bokeh-plot:: __REPO__/examples/topics/graph/static_paths.py

Directed edges
--------------

Add arrowheads to a graph's ``MultiLine`` edge renderer with
:meth:`~bokeh.models.GlyphRenderer.add_path_marking`:

.. code-block:: python

    graph.edge_renderer.add_path_marking(
        NormalHead(size=12),
        at="end", inset="end_inset",
    )

Store ``end_inset`` in the edge data source. For circular ``Scatter`` nodes,
set each edge's inset to half its target node's screen-pixel ``size`` plus
the desired gap. If node sizes change, update these edge values as well.
Path markings do not automatically look up the target node's geometry.
Arrowheads follow the final tangent of sampled edge paths, and the shaft
stops behind each head. Other node shapes require their own boundary-distance
calculation.

This example uses a client-side callback to keep arrow tips outside resizing
nodes, including on curved feedback edges. It also uses state-specific markings
to match the selected and nonselected edge visuals:

.. bokeh-plot:: __REPO__/examples/topics/graph/directed_graph.py
    :source-position: above

Alternate edge glyphs
^^^^^^^^^^^^^^^^^^^^^

A ``Segment`` edge connects the first and last points supplied by the layout
provider. Its endpoint units must be ``"data"``. A ``Bezier`` edge uses those
same endpoints and accepts four per-edge control columns: ``cx0``, ``cy0``,
``cx1``, and ``cy1``. Supply all four with one value per edge. If omitted,
controls are placed at one-third and two-thirds of the straight connection.
A custom BokehJS layout provider can override ``get_edge_control_coordinates``
to compute the controls instead. Layout changes and edge-source updates remap
these coordinates like existing MultiLine graph edges.

.. bokeh-plot:: __REPO__/examples/topics/graph/edge_glyphs.py
    :source-position: above


NetworkX integration
--------------------

Bokeh integrates the NetworkX package so you can quickly plot
network graphs. The ``bokeh.plotting.from_networkx`` convenience
method accepts a ``networkx.Graph`` object and a layout function or a
mapping of node positions. It returns a configured ``GraphRenderer``.

The example below uses the positions generated by NetworkX for a hexagonal
lattice:

.. bokeh-plot:: __REPO__/examples/topics/graph/from_networkx.py
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
HoverTool. ``NodesAndAdjacentNodes()`` lets you inspect a node and all
other nodes connected to it by a graph edge.

You can customize the ``selection_glyph``, ``nonselection_glyph``,
and/or ``hover_glyph`` attributes of the edge and node sub-renderers
to add dynamic visual elements to your graph interactions.

Tap a stop in the example below to select it and its incident edges.

.. bokeh-plot:: __REPO__/examples/topics/graph/interaction_nodeslinkededges.py
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

In the following example, node color identifies each member's club. Edge
attributes highlight ties between the two clubs. Hover over a member to
inspect their attributes:

.. bokeh-plot:: __REPO__/examples/topics/graph/node_and_edge_attributes.py
    :source-position: above
