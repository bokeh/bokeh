''' Compare graph edge glyphs using the same directed topology.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphRenderer, bokeh.models.MultiLine, bokeh.models.Segment, bokeh.models.Bezier
    :refs: :ref:`ug_topics_graph`, :ref:`ug_basic_annotations_arrows`
    :keywords: graph, directed, arrows, multiline, segment, bezier

'''
from bokeh.layouts import column, row
from bokeh.models import (Bezier, Div, GraphRenderer, GraphSelectionPolicy, MultiLine,
                          NormalHead, Scatter, Segment, StaticLayoutProvider)
from bokeh.plotting import figure, show

positions = {0: (0, 0), 1: (2, 0), 2: (1, 1.5)}
plots = []
for title, glyph_type in (
    ("MultiLine: routed vertices", MultiLine),
    ("Segment: endpoints only", Segment),
    ("Bezier: smooth controls", Bezier),
):
    graph = GraphRenderer(name=f"graph-{glyph_type.__name__}", layout_provider=StaticLayoutProvider(graph_layout=positions))
    graph.node_renderer.data_source.data = dict(index=[0, 1, 2])
    graph.node_renderer.glyph = Scatter(size=32, fill_color="#0072B2", line_color="white")
    graph.edge_renderer.data_source.data = dict(
        start=[0, 1, 2], end=[1, 2, 0],
        xs=[[0, 0.5, 1, 1.5, 2], [2, 2.2, 1.8, 1.4, 1], [1, 0.75, 0.25, 0]],
        ys=[[0, -0.35, -0.5, -0.35, 0], [0, 0.4, 0.9, 1.2, 1.5], [1.5, 1, 0.75, 0]],
        cx0=[0.4, 2.2, 0.1], cy0=[-0.8, 0.9, 1.1],
        cx1=[1.6, 1.7, -0.2], cy1=[-0.8, 1.4, 0.6],
    )
    glyph = glyph_type(line_color="#52667a", line_width=2)
    graph.edge_renderer.glyph = glyph
    graph.edge_renderer.selection_glyph = glyph.clone(line_color="#E69F00", line_width=4)
    graph.edge_renderer.add_path_decoration(
        NormalHead(size=12, inherit_visuals=["line_color", "fill_color", "fill_alpha", "line_width"]),
        node="end", inset=18,
    )
    graph.selection_target = "edges"
    graph.data_source.selection_policy = GraphSelectionPolicy(include_end_nodes=True)
    p = figure(width=300, height=330, x_range=(-0.5, 2.5), y_range=(-1, 2),
               title=title, tools="tap,box_select,reset")
    p.axis.visible = False
    p.grid.visible = False
    p.renderers.append(graph)
    plots.append(p)

intro = Div(text="""
<h2 style="margin: 0 0 0.35em">Graph edge glyphs</h2>
<p style="margin: 0">These plots render the same directed graph with three
edge glyphs. <code>MultiLine</code> follows supplied vertices,
<code>Segment</code> connects the endpoints, and <code>Bezier</code> follows
its control points.</p>
""", width=900)

show(column(intro, row(*plots)))
