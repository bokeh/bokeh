"""Update graph nodes and edges from live Python callbacks.

Run with::

    python -m uvicorn graph_updates:application --port 8000
"""

from __future__ import annotations

# Standard library imports
from itertools import pairwise
from math import cos, pi, sin
from typing import Any, cast

# Bokeh imports
from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import (ColumnDataSource, Div, GraphDataSource, GraphRenderer,
                          GraphSelectionPolicy, HoverTool, LabelSet, MultiLine,
                          Scatter, Slider, StaticLayoutProvider, TapTool)
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI

COLORS = ["#4c78a8", "#f58518", "#54a24b", "#e45756",
          "#72b7b2", "#b279a2", "#ff9da6", "#9d755d"]


def graph_records(count: int) -> tuple[list[dict[str, Any]], list[tuple[str, str]]]:
    names = [chr(ord("A") + index) for index in range(count)]
    nodes = []
    for index, name in enumerate(names):
        angle = 2*pi*index/8 + pi/2
        nodes.append({
            "id": name,
            "label": name,
            "x": cos(angle),
            "y": sin(angle),
            "color": COLORS[index],
        })
    return nodes, list(pairwise(names))


def modify_document(doc: Document) -> None:
    initial_nodes, initial_edges = graph_records(4)
    source = GraphDataSource(
        nodes=initial_nodes,
        edges=initial_edges,
        selection_policy=GraphSelectionPolicy(include_incident_edges=True),
        name="graph-source",
    )
    nodes = cast(ColumnDataSource, source.nodes)
    edges = cast(ColumnDataSource, source.edges)
    layout = StaticLayoutProvider(
        graph_layout={node["id"]: (node["x"], node["y"]) for node in initial_nodes},
    )
    graph = GraphRenderer(data_source=source, layout_provider=layout)
    graph.node_renderer.glyph = Scatter(size=30, fill_color="color", line_color="white", line_width=2)
    graph.node_renderer.selection_glyph = graph.node_renderer.glyph.clone(
        size=35, line_color="#111827", line_width=4,
    )
    graph.edge_renderer.glyph = MultiLine(line_color="#64748b", line_width=4, line_alpha=0.75)
    graph.edge_renderer.selection_glyph = graph.edge_renderer.glyph.clone(
        line_color="#f58518", line_width=7, line_alpha=1,
    )

    count = Slider(title="Number of nodes", start=2, end=8, value=4, step=1, name="graph-count")
    status = Div(name="graph-status")
    plot = figure(
        height=440, width=700, x_range=(-1.35, 1.35), y_range=(-1.35, 1.35),
        tools="pan,wheel_zoom,reset", title="Update graph topology through its node and edge sources",
    )
    plot.axis.visible = False
    plot.grid.visible = False
    plot.renderers.append(graph)
    plot.add_layout(LabelSet(
        x="x", y="y", text="label", source=nodes,
        text_align="center", text_baseline="middle", text_color="white", text_font_style="bold",
    ))
    tap = TapTool(renderers=[graph])
    plot.add_tools(tap, HoverTool(renderers=[graph], tooltips=[("node", "@index")]))
    plot.toolbar.active_tap = tap

    def update(_attr: str, _old: int, new: int) -> None:
        previous = len(nodes.data["index"])
        node_records, edge_records = graph_records(new)
        if new > previous:
            added_nodes = node_records[previous:new]
            nodes.stream({
                "index": [node["id"] for node in added_nodes],
                "label": [node["label"] for node in added_nodes],
                "x": [node["x"] for node in added_nodes],
                "y": [node["y"] for node in added_nodes],
                "color": [node["color"] for node in added_nodes],
            })
            edges.stream({
                "start": [start for start, _ in edge_records[previous - 1:]],
                "end": [end for _, end in edge_records[previous - 1:]],
            })
            operation = "stream()"
        else:
            source.selected.nodes.indices = []
            source.selected.edges.indices = []
            nodes.data = {
                "index": [node["id"] for node in node_records],
                "label": [node["label"] for node in node_records],
                "x": [node["x"] for node in node_records],
                "y": [node["y"] for node in node_records],
                "color": [node["color"] for node in node_records],
            }
            edges.data = {
                "start": [start for start, _ in edge_records],
                "end": [end for _, end in edge_records],
            }
            operation = "data replacement"
        layout.graph_layout = {node["id"]: (node["x"], node["y"]) for node in node_records}
        status.text = f"<b>{operation}: {new} nodes and {new - 1} edges.</b> Click a node to select its incident edges."

    count.on_change("value", update)
    update("value", 4, 4)
    doc.add_root(column(
        Div(text="""
            <h2 style="margin:0">GraphDataSource updates</h2>
            <p>The graph owns separate indexed node and edge sources. Increasing the slider streams new
            records to both; decreasing it replaces the topology. Selection policy remains attached.</p>
        """),
        count, status, plot, width=700,
    ))
    doc.title = "ASGI graph updates"


application = BokehASGI(modify_document)
