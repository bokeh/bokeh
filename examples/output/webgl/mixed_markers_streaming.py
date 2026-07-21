"""Exercise mixed-marker selection overrides and streaming updates.

Click the button repeatedly: marker metadata, geometry, and selection masks are
updated without recreating the plot or its WebGL resources.
"""

import numpy as np

from bokeh.models import Button, ColumnDataSource, CustomJS, Scatter
from bokeh.layouts import column
from bokeh.plotting import figure, show

rng = np.random.default_rng(7)
markers = ["circle", "square", "triangle", "diamond", "hex", "star"]
n = 20_000
source = ColumnDataSource(data=dict(
    x=rng.normal(size=n),
    y=rng.normal(size=n),
    marker=[markers[i % len(markers)] for i in range(n)],
    size=np.full(n, 7),
    selected_size=np.full(n, 18),
    color=np.where(np.arange(n) % 2 == 0, "#3b82f6", "#f97316"),
))
source.selected.indices = list(range(0, n, 997))

p = figure(width=900, height=520, output_backend="webgl",
           title="Mixed markers: cached masks, derived sizes, stream/patch refresh")
renderer = p.scatter("x", "y", marker="marker", size="size", color="color",
                     fill_alpha=0.55, line_alpha=0.8, source=source)
renderer.selection_glyph = Scatter(
    size="selected_size", fill_color="color", line_color="white", line_width=2,
)

button = Button(label="Stream and mutate marker types", button_type="primary", width=260)
button.js_on_click(CustomJS(args=dict(source=source, markers=markers), code="""
    const data = source.data
    const i = Math.floor(Math.random()*data.x.length)
    data.marker[i] = markers[(markers.indexOf(data.marker[i]) + 1) % markers.length]
    data.size[i] = 12
    source.patch({marker: [[i, data.marker[i]]], size: [[i, 12]]})
    source.stream({
        x: [2*Math.random() - 1], y: [2*Math.random() - 1],
        marker: [markers[data.x.length % markers.length]], size: [10],
        selected_size: [22], color: ["#22c55e"],
    }, 25000)
    source.selected.indices = [i, data.x.length - 1]
"""))

show(column(button, p))
