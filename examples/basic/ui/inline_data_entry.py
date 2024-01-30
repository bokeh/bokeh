from math import nan

import numpy as np

from bokeh.io import show
from bokeh.models import (XY, Button, Column, CustomJS, Panel,
                          Row, Select, Slider, TapTool, TextInput)
from bokeh.plotting import figure


def plot(N: int):
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

    p = figure(active_scroll="wheel_zoom", lod_threshold=None, title=f"Plot with N={N} circles")
    p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    return p

p = plot(500)

data_entry = Panel(
    position=XY(x=nan, y=nan),
    anchor="top_left",
    stylesheets=[
        """
        :host {
            background-color: white;
            padding: 1em;
            border-radius: 0.5em;
            border: 1px solid lightgrey;
        }
        """,
    ],
    elements=[
        Column(
            children=[
                TextInput(title="Text input"),
                Slider(title="Number slider", start=0, end=10, step=1, value=5),
                Select(value="Category 1", options=["Category 1", "Category 2", "Category 3"]),
                Row(
                    children=[
                        Button(label="Save", button_type="primary"),
                        Button(label="Cancel"),
                    ],
                ),
            ],
        ),
    ],
)
p.elements.append(data_entry)

tap_tool = TapTool(
    behavior="inspect",
    callback=CustomJS(
        args=dict(panel=data_entry),
        code="export default ({panel}, _, {geometries: {x, y}}) => panel.position.setv({x, y})",
    ),
)
p.add_tools(tap_tool)

show(p)
