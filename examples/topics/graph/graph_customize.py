''' Customize the glyphs and positions of a static graph.

.. bokeh-example-metadata::
    :title: Custom graph glyphs
    :apis: bokeh.models.GraphDataSource, bokeh.models.GraphRenderer, bokeh.models.StaticLayoutProvider
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, static layout, ellipse, node styling

'''

from bokeh.models import (
    Ellipse,
    GraphDataSource,
    GraphRenderer,
    LabelSet,
    MultiLine,
    StaticLayoutProvider,
)
from bokeh.plotting import figure, show

positions = {
    "Station": (-2.8, 0),
    "Library": (-0.9, 1.15),
    "Market": (-0.9, -1.15),
    "Park": (0.9, 1.15),
    "School": (0.9, -1.15),
    "River": (2.8, 0),
}
colors = {
    "Station": "#1e40af", "Library": "#0f766e", "Market": "#0f766e",
    "Park": "#0f766e", "School": "#0f766e", "River": "#1e40af",
}
source = GraphDataSource(
    nodes=[dict(id=name, x=x, y=y, color=colors[name]) for name, (x, y) in positions.items()],
    edges=[
        ("Station", "Library"), ("Station", "Market"), ("Library", "Market"),
        ("Library", "Park"), ("Market", "School"), ("Park", "School"),
        ("Park", "River"), ("School", "River"),
    ],
)

graph = GraphRenderer(data_source=source, layout_provider=StaticLayoutProvider(graph_layout=positions))
graph.node_renderer.glyph = Ellipse(width=1.4, height=0.48, fill_color="color", line_color="white", line_width=2)
graph.edge_renderer.glyph = MultiLine(line_color="#94a3b8", line_width=2)
labels = LabelSet(
    x="x", y="y", text="index", source=source.nodes,
    text_color="white", text_align="center", text_baseline="middle",
    text_font_size="12px", text_font_style="bold",
)

p = figure(
    title="Neighborhood bike network", width=640, height=350,
    x_range=(-3.85, 3.85), y_range=(-1.8, 1.8),
    tools=None, background_fill_color="#f8fafc", outline_line_color=None,
)
p.axis.visible = False
p.grid.visible = False
p.renderers.append(graph)
p.add_layout(labels)
show(p)
