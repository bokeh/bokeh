from __future__ import annotations

# Standard library imports
from typing import Any

# External imports
import numpy as np

# Bokeh imports
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div, GridBox, Select, Slider, Toggle
from bokeh.plotting import figure

waveform = Select(
    title="Waveform",
    value="Sine",
    options=["Sine", "Triangle", "Square", "Sawtooth"],
    sizing_mode="stretch_width",
    min_width=0,
    name="waveform",
)
frequency = Slider(title="Frequency", start=0.5, end=5, value=1.5, step=0.1, sizing_mode="stretch_width", min_width=0)
amplitude = Slider(title="Amplitude", start=0.25, end=3, value=1.5, step=0.05, sizing_mode="stretch_width", min_width=0)
phase = Slider(title="Phase", start=0, end=360, value=20, step=1, sizing_mode="stretch_width", min_width=0)
animate = Toggle(
    label="Animate phase",
    active=True,
    button_type="success",
    sizing_mode="stretch_width",
    min_width=0,
    align="end",
)

source = ColumnDataSource(data={"x": [], "y": [], "zero": []}, name="signal-source")
plot = figure(
    height=300,
    sizing_mode="stretch_width",
    output_backend="webgl",
    tools="pan,wheel_zoom,reset,save",
    toolbar_location="above",
    x_axis_label="Time (seconds)",
    y_axis_label="Amplitude",
)
plot.varea(x="x", y1="zero", y2="y", source=source, fill_color="#38bdf8", fill_alpha=0.12)
plot.line(x="x", y="y", source=source, line_color="#38bdf8", line_width=3)
plot.background_fill_color = "#0f172a"
plot.border_fill_color = "#0f172a"
plot.outline_line_color = "#334155"
plot.axis.axis_line_color = "#64748b"
plot.axis.major_label_text_color = "#cbd5e1"
plot.axis.axis_label_text_color = "#94a3b8"
plot.grid.grid_line_color = "#334155"
plot.grid.grid_line_alpha = 0.45

heading = Div(
    text="""
        <div style="color:#7dd3fc;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">
            Live Bokeh server session
        </div>
        <div style="color:#f8fafc;font-size:28px;font-weight:700;margin-top:5px">Signal studio</div>
        <div style="color:#94a3b8;margin-top:5px">Shape a waveform and watch Python callbacks update the document.</div>
    """,
    sizing_mode="stretch_width",
    min_width=0,
)
metric_styles = {
    "background": "#172033",
    "border": "1px solid #334155",
    "border-radius": "10px",
    "padding": "10px 14px",
}
peak_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)
rms_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)
samples_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)

samples = np.linspace(0, 6, 2001)
zero = np.zeros_like(samples)


def update_data() -> None:
    theta = 2 * np.pi * frequency.value * samples + np.deg2rad(phase.value)
    y = np.sin(theta)
    if waveform.value == "Triangle":
        y = 2 / np.pi * np.arcsin(y)
    elif waveform.value == "Square":
        y = np.where(y >= 0, 1.0, -1.0)
    elif waveform.value == "Sawtooth":
        cycles = theta / (2 * np.pi)
        y = 2 * (cycles - np.floor(cycles + 0.5))

    y *= amplitude.value
    peak = np.max(np.abs(y))
    rms = np.sqrt(np.mean(np.square(y)))
    source.data = {"x": samples, "y": y, "zero": zero}
    peak_metric.text = f"""
        <div style="color:#94a3b8;font-size:12px;line-height:16px;text-transform:uppercase;letter-spacing:.08em">Peak</div>
        <strong style="color:#f8fafc;font-size:20px;line-height:24px">{peak:.2f}</strong>
    """
    rms_metric.text = f"""
        <div style="color:#94a3b8;font-size:12px;line-height:16px;text-transform:uppercase;letter-spacing:.08em">RMS</div>
        <strong style="color:#f8fafc;font-size:20px;line-height:24px">{rms:.2f}</strong>
    """
    samples_metric.text = f"""
        <div style="color:#94a3b8;font-size:12px;line-height:16px;text-transform:uppercase;letter-spacing:.08em">Samples</div>
        <strong style="color:#f8fafc;font-size:20px;line-height:24px">{len(samples)}</strong>
    """


def update(attr: str, old: Any, new: Any) -> None:
    update_data()


def advance() -> None:
    if animate.active:
        phase.value = (phase.value + 2) % 360


for control in (waveform, frequency, amplitude, phase):
    control.on_change("value", update)

update_data()
doc = curdoc()
doc.config.color_scheme = "dark"
doc.add_periodic_callback(advance, 75)
doc.template = """
    {% block preamble %}
    <style>
      html, body { margin: 0; padding: 0; overflow-x: hidden; background: #0f172a; }
    </style>
    {% endblock %}
"""
controls = GridBox(
    children=[
        (waveform, 0, 0),
        (animate, 0, 1),
        (frequency, 1, 0),
        (amplitude, 1, 1),
        (phase, 2, 0, 1, 2),
    ],
    cols="minmax(0, 1fr)",
    spacing=(14, 16),
    sizing_mode="stretch_width",
    styles={
        "background": "#111827",
        "border": "1px solid #263449",
        "border-radius": "12px",
        "padding": "14px",
    },
)
metric_grid = GridBox(
    children=[(peak_metric, 0, 0), (rms_metric, 0, 1), (samples_metric, 0, 2)],
    cols="minmax(0, 1fr)",
    spacing=12,
    sizing_mode="stretch_width",
)
doc.add_root(column(
    heading,
    controls,
    metric_grid,
    plot,
    spacing=16,
    sizing_mode="stretch_width",
    styles={"background": "#0f172a", "padding": "20px", "border-radius": "14px"},
))
doc.title = "Bokeh ASGI signal studio"
