import numpy as np

from bokeh.core.properties import field
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import (ColumnDataSource, CustomJS, Div, FactorRange, HoverTool,
                          Range1d, Switch, WheelZoomTool, ZoomInTool, ZoomOutTool)
from bokeh.palettes import Category10
from bokeh.plotting import figure

n_channels = 10
n_seconds = 15

total_samples = 512*n_seconds
time = np.linspace(0, n_seconds, total_samples)
data = np.random.randn(n_channels, total_samples).cumsum(axis=1)
channels = [f"EEG {i}" for i in range(n_channels)]

hover = HoverTool(tooltips=[
    ("Channel", "$name"),
    ("Time", "$x s"),
    ("Amplitude", "$y µV"),
])

x_range = Range1d(start=time.min(), end=time.max())
y_range = FactorRange(factors=channels)

p = figure(x_range=x_range, y_range=y_range, lod_threshold=None, tools="pan,reset")

source = ColumnDataSource(data=dict(time=time))
renderers = []

for i, channel in enumerate(channels):
    xy = p.subplot(
        x_source=p.x_range,
        y_source=Range1d(start=data[i].min(), end=data[i].max()),
        x_target=p.x_range,
        y_target=Range1d(start=i, end=i + 1),
    )

    source.data[channel] = data[i]
    line = xy.line(field("time"), field(channel), color=Category10[10][i], source=source, name=channel)
    renderers.append(line)

level = 1

ywheel_zoom = WheelZoomTool(renderers=renderers, level=level, dimensions="height")
xwheel_zoom = WheelZoomTool(renderers=renderers, level=level, dimensions="width")
zoom_in = ZoomInTool(renderers=renderers, level=level, dimensions="height")
zoom_out = ZoomOutTool(renderers=renderers, level=level, dimensions="height")

p.add_tools(ywheel_zoom, xwheel_zoom, zoom_in, zoom_out, hover)
p.toolbar.active_scroll = ywheel_zoom

on_change = CustomJS(
    args=dict(tools=[ywheel_zoom, zoom_in, zoom_out]),
    code="""
export default ({tools}, obj) => {
    const level = obj.active ? 1 : 0
    for (const tool of tools) {
        tool.level = level
    }
}
""")

label = Div(text="Zoom sub-coordinates:")
widget = Switch(active=level == 1)
widget.js_on_change("active", on_change)

show(column(row(label, widget), p))
