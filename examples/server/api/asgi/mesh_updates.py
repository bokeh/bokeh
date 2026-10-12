"""Patch shared mesh vertices from live Python callbacks.

Run with::

    python -m uvicorn mesh_updates:application --port 8000
"""

from __future__ import annotations

from typing import cast

from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div, MeshDataSource, Slider
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI

COLORS = ["#4c78a8", "#f58518", "#54a24b", "#e45756"]


def modify_document(doc: Document) -> None:
    mesh = MeshDataSource(
        vertices=[(0.0, 0.0), (2.0, 0.0), (2.0, 2.0), (0.0, 2.0), (1.0, 1.0)],
        cells=[
            ([0, 1, 4], {"color": COLORS[0]}),
            ([1, 2, 4], {"color": COLORS[1]}),
            ([2, 3, 4], {"color": COLORS[2]}),
            ([3, 0, 4], {"color": COLORS[3]}),
        ],
        name="mesh-source",
    )
    vertices = cast(ColumnDataSource, mesh.vertices)
    center = Slider(
        title="Shared center x-coordinate", start=0.55, end=1.45, value=1, step=0.05,
        name="mesh-center",
    )
    status = Div(name="mesh-status")
    plot = figure(
        height=430, width=600, x_range=(-0.15, 2.15), y_range=(-0.15, 2.15),
        match_aspect=True, tools="pan,wheel_zoom,reset,tap,hover",
        tooltips=[("cell vertices", "@vertices")], title="Patch one shared vertex, redraw four cells",
    )
    plot.polygons(
        mesh, fill_color="color", fill_alpha=0.85, line_color="white", line_width=4,
        hover_fill_alpha=1, selection_line_color="#111827",
    )
    plot.scatter(x="x", y="y", source=vertices, size=10, color="#111827")

    def update(_attr: str, _old: float, new: float) -> None:
        vertices.patch({"x": [(4, new)]})
        status.text = (
            f"<b>vertices.patch() moved vertex 4 to x={new:.2f}.</b> "
            "All four cells update without resending their connectivity."
        )

    center.on_change("value", update)
    update("value", 1, 1)
    doc.add_root(column(
        Div(text="""
            <h2 style="margin:0">MeshDataSource updates</h2>
            <p>Four triangles share the center vertex. Move it with one Python-side patch and every
            dependent polygon is reconstructed in the browser from the unchanged cell indices.</p>
        """),
        center, status, plot, width=600,
    ))
    doc.title = "ASGI mesh updates"


application = BokehASGI(modify_document)
