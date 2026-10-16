''' Segment and Bezier glyphs as decorated directed graph edges.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphRenderer, bokeh.models.Segment, bokeh.models.Bezier
    :refs: :ref:`ug_topics_graph`, :ref:`ug_basic_annotations_arrows`
    :keywords: graph, directed, arrows, segment, bezier

'''
from bokeh.layouts import row
from bokeh.models import (Bezier, EdgesAndLinkedNodes, GraphRenderer, MultiLine,
                          NormalHead, Scatter, Segment, StaticLayoutProvider)
from bokeh.plotting import figure, show

positions = {0: (0, 0), 1: (2, 0), 2: (1, 1.5)}
plots = []
for glyph_type in (MultiLine, Segment, Bezier):
    graph = GraphRenderer(name=f"graph-{glyph_type.__name__}", layout_provider=StaticLayoutProvider(graph_layout=positions))
    graph.node_renderer.data_source.data = dict(index=[0, 1, 2])
    graph.node_renderer.glyph = Scatter(size=32, fill_color="#0072B2", line_color="white")
    graph.edge_renderer.data_source.data = dict(
        start=[0, 1, 2], end=[1, 2, 0],
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
    graph.selection_policy = EdgesAndLinkedNodes()
    p = figure(width=300, height=330, x_range=(-0.5, 2.5), y_range=(-1, 2),
               title=glyph_type.__name__, tools="tap,box_select,reset")
    p.axis.visible = False
    p.grid.visible = False
    p.renderers.append(graph)
    plots.append(p)

layout = row(*plots)
show(layout)
