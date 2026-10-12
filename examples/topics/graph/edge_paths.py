''' Compare sampled graph edge path providers.

.. bokeh-example-metadata::
    :apis: bokeh.models.ArcEdgePathProvider, bokeh.models.BezierEdgePathProvider, bokeh.models.OrthogonalEdgePathProvider,
        bokeh.models.StraightEdgePathProvider, bokeh.plotting.figure.graph
    :refs: :ref:`ug_topics_graph_edge_paths`
    :keywords: graph, network, edges, arc, bezier, orthogonal
'''

# Standard library imports
from collections.abc import Sequence

# Bokeh imports
from bokeh.layouts import gridplot
from bokeh.models import (
    ArcEdgePathProvider,
    BezierEdgePathProvider,
    NormalHead,
    OrthogonalEdgePathProvider,
    StaticLayoutProvider,
    StraightEdgePathProvider,
)
from bokeh.plotting import figure, show

nodes = [
    {"id": "A", "color": "#4c78a8"},
    {"id": "B", "color": "#f58518"},
    {"id": "C", "color": "#e45756"},
    {"id": "D", "color": "#72b7b2"},
]
edges = [
    ("A", "B", {"curvature": 0.14, "offset": -0.18, "loop_radius": 0.28, "arrow_size": 11}),
    ("A", "B", {"curvature": -0.14, "offset": 0.18, "loop_radius": 0.28, "arrow_size": 15}),
    ("B", "C", {"curvature": 0.08, "offset": 0.0, "loop_radius": 0.28, "arrow_size": 13}),
    ("C", "D", {"curvature": -0.08, "offset": 0.0, "loop_radius": 0.28, "arrow_size": 13}),
    ("D", "A", {"curvature": 0.08, "offset": 0.0, "loop_radius": 0.28, "arrow_size": 13}),
    ("C", "C", {"curvature": 0.0, "offset": 0.0, "loop_radius": 0.28, "arrow_size": 15}),
]
layout: dict[int | str, Sequence[float]] = {
    "A": (0, 0), "B": (2, 0), "C": (2, 2), "D": (0, 2),
}

providers = [
    ("Straight", StraightEdgePathProvider(loop_radius="loop_radius")),
    ("Quadratic Bezier", BezierEdgePathProvider(
        curvature="curvature", parallel_spacing=0, loop_radius="loop_radius",
    )),
    ("Circular arc", ArcEdgePathProvider(
        curvature="curvature", parallel_spacing=0, loop_radius="loop_radius",
    )),
    ("Orthogonal", OrthogonalEdgePathProvider(
        offset="offset", corner_radius=0.12, loop_radius="loop_radius", steps=8,
    )),
]

plots = []
for title, provider in providers:
    p = figure(
        width=360,
        height=320,
        x_range=(-0.5, 2.5),
        y_range=(-0.5, 2.7),
        tools="tap,reset",
        title=title,
    )
    graph = p.graph(
        nodes,
        edges,
        StaticLayoutProvider(graph_layout=layout),
        edge_path_provider=provider,
        node_size=18,
        node_fill_color="color",
        node_line_color="white",
        edge_line_alpha=0.65,
        edge_line_width=2,
    )
    graph.edge_renderer.add_decoration(
        NormalHead(size="arrow_size", fill_color="#52667a", line_color=None),
        "end",
        inset=11,
    )
    p.axis.visible = False
    p.grid.visible = False
    plots.append(p)

show(gridplot(plots, ncols=2, merge_tools=False))
