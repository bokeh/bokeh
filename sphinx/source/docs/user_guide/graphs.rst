.. _userguide_graphs:

Visualizing Network Graphs
==========================

Bokeh has added native support for creating network graph visualizations with
customizable interactions between linked edges and nodes. The new
GraphRenderer contains GlyphRenderers for the nodes and edges in order to
*** the link and styling data for the ***.

Additionally, there's a LayoutProvider model that supplies the graph layout in
Cartesian space and interaction policies that coordinate the inspection and
selection of the edges and nodes.

Edge and Node Renderers
-----------------------

A GraphRenderer has ``node_renderer`` and ``edge_renderer`` attributes that
accept **

There's a couple requirements
* The ColumnDataSource associated with the ``node_renderer`` must have a column
named ``"index"`` that contains the unique indices of the nodes, so that the
edges can know their start and end nodes.
* The ColumnDataSource associated with the ``edge_renderer`` has two required
columns: ``"start"`` and ``"end"``, which contain the data for the nodes (by
index).

It's also possible to add extra data to these data sources to in order to
control styling, add meta-data for hovering, or add meta-data to be
available in callbacks.

Interaction Policies
--------------------

The GraphRenderer model also has ``inspection_policy`` and ``selection_policy``
attributes that accept special ``GraphHitTestPolicy`` models in order to
support graph-specific interactions. For example, setting
``selection_policy=NodesAndLinkedEdges`` will cause associated edges to also
be selected upon selecting a node via a SelectionTool. Similarly, setting
``inspection_policy=EdgesAndLinkedNodes`` will cause the start and end nodes
of an edge to also be inspected upon hovering an edge with the HoverTool.

Users may want to customize the selection_glyph, nonselection_glyph, and/or
hover_glyph attributes of the edge_renderer and node_renderer with


Layout Providers
----------------

Dict.

Supports not

Networkx Integration
--------------------

It's possible to quickly create a graph visualization using the
``bokeh.models.graphs.from_networkx`` method. This function accepts a
``networkx.Graph`` object and a networkx layout method and returns a
complete GraphRenderer with
