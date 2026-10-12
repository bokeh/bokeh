"""Update natural geometry records from live Python callbacks.

Run with::

    python -m uvicorn geometry_updates:application --port 8000
"""

from __future__ import annotations

from typing import Any

from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import Div, GeometryDataSource, Slider
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI

COLORS = ["#4c78a8", "#f58518", "#54a24b", "#e45756",
          "#72b7b2", "#b279a2", "#ff9da6", "#9d755d"]


def feature(index: int) -> dict[str, Any]:
    x = 1.35*(index % 4)
    y = 1.35*(index // 4)
    return {
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]],
        },
        "label": f"Region {index + 1}",
        "color": COLORS[index],
    }


def modify_document(doc: Document) -> None:
    source = GeometryDataSource([feature(index) for index in range(3)], name="geometry-source")
    count = Slider(title="Number of regions", start=1, end=8, value=3, step=1, name="geometry-count")
    status = Div(name="geometry-status")

    plot = figure(
        height=360, width=700, x_range=(-0.25, 5.3), y_range=(-0.25, 2.6),
        tools="pan,wheel_zoom,reset,tap,hover", tooltips=[("region", "@label")],
        title="Stream and replace natural geometry records",
    )
    plot.polygons(
        source, fill_color="color", fill_alpha=0.8, line_color="white", line_width=3,
        hover_fill_alpha=1, selection_line_color="#111827",
    )

    def update(_attr: str, _old: int, new: int) -> None:
        previous = source.length
        if new > previous:
            source.stream([feature(index) for index in range(previous, new)])
            operation = "stream()"
        else:
            source.replace([feature(index) for index in range(new)])
            operation = "replace()"
        status.text = f"<b>{operation}: {new} geometry records.</b> Each polygon remains one selectable feature."

    count.on_change("value", update)
    update("value", 3, 3)
    doc.add_root(column(
        Div(text="""
            <h2 style="margin:0">GeometryDataSource updates</h2>
            <p>Increase the slider to stream complete geometry records from Python. Decrease it to replace
            the collection. Geometry hierarchy and aligned attributes cross the WebSocket together.</p>
        """),
        count, status, plot, width=700,
    ))
    doc.title = "ASGI geometry updates"


application = BokehASGI(modify_document)
