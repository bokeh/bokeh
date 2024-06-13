import numpy as np

from bokeh.core.properties import field
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import (ColumnDataSource, CustomJS, Div, FactorRange,
                          GroupByModels, HoverTool, Range1d, Select,
                          Switch, WheelZoomTool, ZoomInTool, ZoomOutTool)
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
    ("Amplitude", "$y μV"),
])

x_range = Range1d(start=time.min(), end=time.max())
y_range = FactorRange(factors=channels)

p = figure(x_range=x_range, y_range=y_range, lod_threshold=None, tools="pan,reset,xcrosshair")

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
hit_test = False
only_hit = True

group_by = GroupByModels(groups=[renderers[0::2], renderers[1::2]])
behavior = "only_hit" if only_hit else group_by

ywheel_zoom = WheelZoomTool(renderers=renderers, level=level, hit_test=hit_test, hit_test_mode="hline", hit_test_behavior=behavior, dimensions="height")
xwheel_zoom = WheelZoomTool(renderers=renderers, level=level, hit_test=hit_test, hit_test_mode="hline", hit_test_behavior=behavior, dimensions="width")
zoom_in = ZoomInTool(renderers=renderers, level=level, dimensions="height")
zoom_out = ZoomOutTool(renderers=renderers, level=level, dimensions="height")

p.add_tools(ywheel_zoom, xwheel_zoom, zoom_in, zoom_out, hover)
p.toolbar.active_scroll = ywheel_zoom

level_switch = Switch(active=level == 1)
hit_test_switch = Switch(active=hit_test)
behavior_select = Select(
    disabled=not hit_test_switch.active,
    value=behavior,
    options=[
        ("only_hit", "Only hit renderers"),
        (group_by, "Even/Odd groups of renderers"),
    ],
)

level_switch.js_on_change("active", CustomJS(
    args=dict(tools=[ywheel_zoom, zoom_in, zoom_out]),
    code="""
export default ({tools}, obj) => {
    const level = obj.active ? 1 : 0
    for (const tool of tools) {
        tool.level = level
    }
}
"""))

hit_test_switch.js_on_change("active", CustomJS(
    args=dict(tool=ywheel_zoom, select=behavior_select),
    code="""
export default ({tool, select}, obj) => {
    tool.hit_test = obj.active
    select.disabled = !obj.active
}
"""))

behavior_select.js_on_change("value", CustomJS(
    args=dict(tool=ywheel_zoom),
    code="""
export default ({tool}, obj) => {
    tool.hit_test_behavior = obj.value
}
"""))

layout = column(
    row(Div(text="Enable zooming of sub-coordinates:"), level_switch),
    row(Div(text="Enable hit-testing based zooming:"), hit_test_switch),
    row(Div(text="Hit test behavior:"), behavior_select),
    p,
)

show(layout)
