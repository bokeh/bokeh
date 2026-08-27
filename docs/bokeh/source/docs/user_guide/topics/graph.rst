.. _ug_topics_graph:

Network graphs
==============

Bokeh lets you create network graph visualizations and configure
interactions between edges and nodes.

Overview
--------

Graph drawing is done using the ``GraphRenderer`` model.

In order to create a network visualization, you need to specify:

- node and edge data using the ``data_source`` attribute
- node glyphs using the ``node_renderer`` attribute
- edge glyphs using the ``edge_renderer`` attribute
- the layout strategy using the ``layout_provider`` attribute
- optional edge routing using the ``edge_path_provider`` attribute

While the positions of the nodes could theoretically be stored in the ``node_renderer``,
this approach allows for more flexibility. The same graph data can be viewed differently
depending on the ``layout_provider``, which will dictate the placement of the nodes.


Edge and node renderers
-----------------------

By default, the glyph used in ``node_renderer`` is
:class:`~bokeh.models.Scatter`. You can replace it with any ``XYGlyph``, such
as ``Ellipse`` or ``Rect``.

Similarly, you can modify the style properties
of edges through the ``edge_renderer`` property. Supported edge glyphs are ``MultiLine``, ``Patches``, ``Segment``, and ``Bezier``.
Choose the edge glyph before displaying the graph.

The :class:`~bokeh.models.sources.GraphDataSource` assigned to
``data_source`` keeps the node and edge sources together. The sub-renderers
are bound to these sources: ``node_renderer.data_source`` is
``data_source.nodes`` and ``edge_renderer.data_source`` is
``data_source.edges``.

Observe the following requirements for the child sources:

* The node source must expose an ``"index"`` field with the unique indices
  of the nodes.
* The edge source must expose ``"start"`` and ``"end"`` fields. These fields
  contain the node indices for the start and end of the edges.

Both children are :class:`~bokeh.models.sources.IndexedDataSource` instances
and can use any supported storage layout. By default, ``GraphDataSource`` creates
:class:`~bokeh.models.sources.ColumnDataSource` children using the traditional
``"index"``, ``"start"``, and ``"end"`` columns.

You do not have to reshape ordinary graph data into those columns yourself.
``GraphDataSource`` accepts node identifiers, node or edge record mappings,
edge tuples, and NetworkX-like graph objects. It normalizes familiar ``id``,
``source``, and ``target`` names internally. The normalized node and edge
sources are regular Bokeh models, so changes, selections, and server sessions
use the same synchronization protocol as other data sources.

You can add extra meta-data to these sources to enable vectorized
glyph styling or make data available for callbacks or hover tooltips.

The following code snippet

* replaces a node glyph with an Ellipse,
* assigns scalar values to the ``height`` and ``width`` attributes of the Ellipse,
* assigns a palette to the ``fill_color`` attribute of the Ellipse,
* and adds the assigned values to the node data source.

.. code-block:: python

    import math
    from bokeh.plotting import figure, show
    from bokeh.models import (
        Ellipse,
        GraphDataSource,
        GraphRenderer,
        StaticLayoutProvider,
    )
    from bokeh.palettes import Spectral8

    # list the nodes and initialize a plot
    N = 8
    node_indices = list(range(N))

    plot = figure(title="Graph layout demonstration", x_range=(-1.1,1.1),
                  y_range=(-1.1,1.1), tools="", toolbar_location=None)

    graph_source = GraphDataSource(
        nodes=[
            {"id": index, "fill_color": color}
            for index, color in zip(node_indices, Spectral8)
        ],
        edges=[(0, index) for index in node_indices],
    )
    graph = GraphRenderer(data_source=graph_source)

    # replace the node glyph with an ellipse
    # set its height, width, and fill_color
    graph.node_renderer.glyph = Ellipse(height=0.1, width=0.2,
                                        fill_color="fill_color")

Bokeh layout providers translate graph topology into node positions.
:class:`~bokeh.models.graphs.StaticLayoutProvider` accepts an
explicit dictionary of node positions. Other providers compute positions in
BokehJS, so they work in standalone documents, notebooks, and server sessions
without a JavaScript graph-layout dependency:

* :class:`~bokeh.models.graphs.CircularLayoutProvider` places nodes around a circle.
* :class:`~bokeh.models.graphs.GridLayoutProvider` places nodes on a row-major grid.
* :class:`~bokeh.models.graphs.ForceDirectedLayoutProvider` runs a deterministic,
  dependency-free Fruchterman-Reingold layout suitable for small and medium graphs.

The graph data and provider settings synchronize normally in server sessions;
the derived coordinates stay in the browser and are recomputed when topology
or layout settings change.

The following code snippet uses this provider model to produce a
plot based on the setup above.

.. code-block:: python

    # generate ellipses based on the ``node_indices`` list
    circ = [i*2*math.pi/8 for i in node_indices]

    # create lists of x- and y-coordinates
    x = [math.cos(i) for i in circ]
    y = [math.sin(i) for i in circ]

    # convert the ``x`` and ``y`` lists into a dictionary of 2D-coordinates
    # and assign each entry to a node on the ``node_indices`` list
    graph_layout = dict(zip(node_indices, zip(x, y)))

    # use the provider model to supply coordinates to the graph
    graph.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

    # render the graph
    plot.renderers.append(graph)

    # display the plot
    show(plot)

Put together, the above code snippets produce the following result:

.. bokeh-plot:: __REPO__/examples/topics/graph/graph_customize.py
    :source-position: none

Client-side layouts
-------------------

Assign an algorithmic provider exactly like a static provider. The following
example passes ordinary node records and edge tuples to ``GraphDataSource`` and
does not compute coordinates in Python:

.. bokeh-plot:: __REPO__/examples/topics/graph/client_side_layout.py
    :source-position: above

NetworkX graphs can also use a client-side provider directly:

.. code-block:: python

    renderer = from_networkx(
        graph,
        ForceDirectedLayoutProvider(seed=7, iterations=150),
        edge_path_provider=BezierEdgePathProvider(curvature=0.15),
    )

.. _ug_topics_graph_edge_paths:

Edge path providers
-------------------

The ``GraphRenderer.edge_path_provider`` independently controls how node
positions are connected. The default
:class:`~bokeh.models.graphs.StraightEdgePathProvider` draws straight edges.
Other dependency-free providers derive sampled paths in BokehJS:

* :class:`~bokeh.models.graphs.ArcEdgePathProvider` draws circular arcs.
* :class:`~bokeh.models.graphs.BezierEdgePathProvider` draws quadratic Bezier curves.
* :class:`~bokeh.models.graphs.OrthogonalEdgePathProvider` draws horizontal and
  vertical routes with optional rounded corners.

Curve properties are data specs, so a fixed value or an edge field can control
each path. Parallel arc and Bezier edges receive stable offsets, and all path
providers draw self-loops using ``loop_radius``:

.. code-block:: python

    graph.edge_path_provider = BezierEdgePathProvider(
        curvature="curvature",
        parallel_spacing=0.15,
        loop_radius="loop_radius",
        loop_spacing=0.25,
        steps=24,
    )

The same provider can be supplied directly to ``figure.graph(...)`` or
``from_networkx(...)`` with the ``edge_path_provider`` keyword.

This example compares all four providers using per-edge parameters, parallel
edges, and a self-loop:

.. bokeh-plot:: __REPO__/examples/topics/graph/edge_paths.py
    :source-position: above

Changing graph topology, node layout, or path-provider settings recomputes the
sampled paths in the browser. Only graph data and model settings synchronize in
server sessions.

Explicit paths
--------------

To override generated paths, supply lists of paths to the
:class:`bokeh.models.sources.ColumnDataSource` data source of the
``GraphDataSource.edges``. Every edge path provider looks for ``"xs"`` and
``"ys"`` columns and gives them precedence for corresponding edges. The paths
should be in the same order as the ``"start"``
and ``"end"`` points. Be extra careful when setting
explicit paths because there is no validation to check if they match
with node positions.

The following extends the example above and draws quadratic bezier
curves between the nodes:

.. bokeh-plot:: __REPO__/examples/topics/graph/static_paths.py

Directed edges
--------------

Add arrowheads to a graph's ``MultiLine`` edge renderer with
:meth:`~bokeh.models.GlyphRenderer.add_path_decoration`:

.. code-block:: python

    graph.edge_renderer.add_path_decoration(
        NormalHead(size=12),
        node="end", inset="end_inset",
    )

Store ``end_inset`` in the edge data source. For circular ``Scatter`` nodes,
set each edge's inset to half its target node's screen-pixel ``size`` plus
the desired gap. If node sizes change, update these edge values as well.
Decorations do not automatically look up the target node's geometry.
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
A custom BokehJS edge path provider can override
``get_edge_control_coordinates`` to compute the controls instead. Layout
changes and edge-source updates remap these coordinates like existing
MultiLine graph edges.

.. bokeh-plot:: __REPO__/examples/topics/graph/edge_glyphs.py
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

.. bokeh-plot:: __REPO__/examples/topics/graph/from_networkx.py
    :source-position: above

Graph interactions
------------------

Graph interaction has two independent parts:

* ``GraphRenderer.selection_target`` and ``inspection_target`` choose which
  component receives direct hit tests: ``"nodes"`` or ``"edges"``.
* ``GraphDataSource.selection_policy`` controls persistent selection
  propagation, while ``GraphRenderer.inspection_policy`` independently
  controls transient hover/inspection propagation.

The former ``UnionRenderers`` and ``IntersectRenderers`` classes are replaced
by one general source policy. Use ``SelectionPolicy(combine="union")`` (the
default) or ``SelectionPolicy(combine="intersection")`` on an indexed data
source. ``GraphSelectionPolicy`` uses the same ``combine`` setting before it
expands direct hits through graph topology.

This separation avoids a class for every node/edge behavior combination. For
example, the following configuration directly selects nodes and includes their
incident edges, while directly inspecting edges and including their endpoint
nodes:

.. code-block:: python

    from bokeh.models import GraphSelectionPolicy

    graph.selection_target = "nodes"
    graph.inspection_target = "edges"
    graph.data_source.selection_policy = GraphSelectionPolicy(
        include_incident_edges=True,
    )
    graph.inspection_policy = GraphSelectionPolicy(
        include_end_nodes=True,
    )

Node traversal supports arbitrary distances. ``node_hops=2`` includes nodes up
to two hops from each direct hit. Set ``node_hops_mode="exact"`` to include only
the two-hop frontier, ``include_direct=False`` to omit the root nodes, or
``node_direction="in"`` or ``"out"`` for directed traversal.

Persistent expansion updates the normal ``selected`` state of the child
sources; transient expansion updates their ``inspected`` state. This means
standalone JavaScript and Bokeh server callbacks observe the same state, and
node identifiers can be recovered without a graph-specific callback API:

.. code-block:: python

    node_source = graph.data_source.nodes

    def selected_nodes(attr, old, indices):
        node_ids = [node_source.data["index"][i] for i in indices]
        print(node_ids)

    node_source.selected.on_change("indices", selected_nodes)

You can customize the ``selection_glyph``, ``nonselection_glyph``,
and/or ``hover_glyph`` attributes of the edge and node sub-renderers
to add dynamic visual elements to your graph interactions.

Below are examples of graphs with added node and edge interactions:

.. tab-set::

    .. tab-item:: Nodes and incident edges

        .. bokeh-plot:: __REPO__/examples/topics/graph/interaction_nodeslinkededges.py
            :source-position: above

    .. tab-item:: Edges and endpoint nodes

        .. bokeh-plot:: __REPO__/examples/topics/graph/interaction_edgeslinkednodes.py
            :source-position: above

    .. tab-item:: One-hop neighborhood

        .. bokeh-plot:: __REPO__/examples/topics/graph/interaction_nodesadjacentnodes.py
            :source-position: above

    .. tab-item:: Two-hop neighborhood

        .. bokeh-plot:: __REPO__/examples/topics/graph/interaction_nodes_n_hops.py
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

.. bokeh-plot:: __REPO__/examples/topics/graph/node_and_edge_attributes.py
    :source-position: above
