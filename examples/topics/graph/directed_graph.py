''' Directed graph edges with arrowheads that track changing node sizes.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphRenderer, bokeh.models.GlyphRenderer.add_path_decoration, bokeh.models.CustomJS
    :refs: :ref:`ug_topics_graph`, :ref:`ug_basic_annotations_arrows`
    :keywords: graph, directed, arrows, decorations, callbacks

'''
from bokeh.layouts import column
from bokeh.models import (
    CustomJS,
    Div,
    GraphRenderer,
    MultiLine,
    NodesAndLinkedEdges,
    NormalHead,
    Scatter,
    Slider,
    StaticLayoutProvider,
    TapTool,
)
from bokeh.plotting import figure, show

positions = {
    0: (-2, 0), 1: (-0.7, 1.2), 2: (-0.7, -1.2),
    3: (0.8, 0.9), 4: (0.8, -0.9), 5: (2.2, 0),
}
base_size = [36, 42, 42, 48, 48, 38]
starts = [0, 0, 1, 2, 3, 4, 3, 4]
ends = [1, 2, 3, 4, 5, 5, 4, 1]

# Sample quadratic paths, with a larger bend for the feedback edge.
xs, ys = [], []
for start, end, bend in zip(starts, ends, [0.15, -0.15, 0.15, -0.15, 0.15, -0.15, 0.3, 0.9]):
    x0, y0 = positions[start]
    x1, y1 = positions[end]
    cx = (x0 + x1)/2 - bend*(y1 - y0)
    cy = (y0 + y1)/2 + bend*(x1 - x0)
    steps = [i/40 for i in range(41)]
    xs.append([(1-t)**2*x0 + 2*(1-t)*t*cx + t**2*x1 for t in steps])
    ys.append([(1-t)**2*y0 + 2*(1-t)*t*cy + t**2*y1 for t in steps])

graph = GraphRenderer(layout_provider=StaticLayoutProvider(graph_layout=positions))
nodes = graph.node_renderer.data_source
nodes.name = "directed-nodes"
nodes.data = dict(
    index=list(positions), label=["Input", "A", "B", "C", "D", "Output"],
    x=[xy[0] for xy in positions.values()], y=[xy[1] for xy in positions.values()],
    base_size=base_size, size=base_size,
    color=["#0072B2", "#009E73", "#009E73", "#CC79A7", "#CC79A7", "#0072B2"],
)
node_glyph = Scatter(marker="circle", size="size", fill_color="color",
                     line_color="white", line_width=2)
graph.node_renderer.glyph = node_glyph
graph.node_renderer.selection_glyph = node_glyph.clone(line_color="#E69F00", line_width=3)

edges = graph.edge_renderer.data_source
edges.name = "directed-edges"
edges.data = dict(start=starts, end=ends, xs=xs, ys=ys,
                  end_inset=[base_size[end]/2 + 2 for end in ends])
edge_glyph = MultiLine(line_color="#52667a", line_width=2)
graph.edge_renderer.glyph = edge_glyph
graph.edge_renderer.selection_glyph = edge_glyph.clone(line_color="#E69F00", line_width=3)
graph.edge_renderer.nonselection_glyph = edge_glyph.clone(line_alpha=0.25)
head = NormalHead(size=12, fill_color="#52667a", line_color=None)
graph.edge_renderer.add_path_decoration(
    head,
    node="end", inset="end_inset",
    selection_marking=head.clone(fill_color="#E69F00"),
    nonselection_marking=head.clone(fill_alpha=0.25),
)
graph.selection_policy = NodesAndLinkedEdges()

p = figure(width=750, height=500, x_range=(-2.5, 2.7), y_range=(-1.7, 1.7),
           title="Directed graph: arrowheads follow node size", tools="reset")
p.axis.visible = False
p.grid.visible = False
p.renderers.append(graph)
p.add_tools(TapTool(renderers=[graph]))
p.text(x="x", y="y", text="label", source=nodes,
       text_align="center", text_baseline="middle",
       text_color="white", text_font_size="10px")

size = Slider(title="Node size multiplier", start=0.6, end=1.8, value=1, step=0.1,
              width=750, name="node-size-multiplier")
size.js_on_change("value", CustomJS(args=dict(nodes=nodes, edges=edges), code="""
    nodes.data.size = nodes.data.base_size.map((size) => size*cb_obj.value)
    const sizes = new Map(nodes.data.index.map((id, i) => [id, nodes.data.size[i]]))
    // Scatter circle size is a screen-pixel diameter. Leave a 2px gap.
    edges.data.end_inset = edges.data.end.map((id) => sizes.get(id)/2 + 2)
    nodes.change.emit()
    edges.change.emit()
"""))

layout = column(Div(text="Resize the nodes: arrow tips stay just outside their boundaries. "
                        "Click a node to highlight its incident directed edges.", width=750),
                size, p)
show(layout)
