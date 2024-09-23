import numpy as np

from bokeh.core.properties import field
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import (ColumnDataSource, FactorRange, Metric,
                          Range1d, ScaleBar, WheelZoomTool)
from bokeh.palettes import Category10
from bokeh.plotting import figure

n_eeg_channels = 3
n_pos_channels = 2
n_channels = n_eeg_channels + n_pos_channels
n_seconds = 15
total_samples = 512*n_seconds
time = np.linspace(0, n_seconds, total_samples)
data = np.random.randn(n_channels, total_samples).cumsum(axis=1)
channels = [f"EEG {i}" for i in range(n_eeg_channels)] + [f"POS {i}" for i in range(n_pos_channels)]

x_range = Range1d(start=time.min(), end=time.max())
y_range = FactorRange(factors=channels)

ywheel_zoom = WheelZoomTool(level=1, dimensions="height")

p = figure(x_range=x_range, y_range=y_range, tools=["pan", "reset", ywheel_zoom], active_scroll=ywheel_zoom)

source = ColumnDataSource(data=dict(time=time))

renderers = {}
for i, channel in enumerate(channels):
    subp = p.subplot(
        x_source=p.x_range,
        y_source=Range1d(start=data[i].min(), end=data[i].max()),
        x_target=p.x_range,
        y_target=Range1d(start=i, end=i + 1),
    )

    source.data[channel] = data[i]
    line = subp.line(field("time"), field(channel), color=Category10[10][i], source=source, name=channel)
    renderers[channel] = line

ywheel_zoom.renderers = [*renderers.values()]

eeg_channel = "EEG 1"
eeg_scale_bar = ScaleBar(
    range=renderers[eeg_channel].coordinates.y_source,
    unit="µV",
    dimensional=Metric(base_unit="V"),
    orientation="vertical",
    location=("left", eeg_channel),
    anchor="auto",
    label_location="right",
    background_fill_color=None,
    border_line_color=None,
    bar_length=0.5,
    bar_length_units="data",
    margin=10,
    padding=0,
)
p.add_layout(eeg_scale_bar)

pos_channel = "POS 0"
pos_scale_bar = ScaleBar(
    range=renderers[pos_channel].coordinates.y_source,
    unit="µm",
    dimensional=Metric(base_unit="m"),
    orientation="vertical",
    location=("left", pos_channel),
    anchor="auto",
    label_location="right",
    background_fill_color=None,
    border_line_color=None,
    bar_length=0.5,
    bar_length_units="data",
    margin=10,
    padding=0,
)
p.add_layout(pos_scale_bar)

show(column(p))
