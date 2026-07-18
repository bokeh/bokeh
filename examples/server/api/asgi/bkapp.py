from __future__ import annotations

from typing import Any

import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Div, Select, Slider, Toggle
from bokeh.plotting import figure


waveform = Select(
    title="Waveform",
    value="Sine",
    options=["Sine", "Triangle", "Square", "Sawtooth"],
    width=150,
    name="waveform",
)
frequency = Slider(title="Frequency", start=0.5, end=5, value=1.5, step=0.1, width=220)
amplitude = Slider(title="Amplitude", start=0.25, end=3, value=1.5, step=0.05, width=220)
phase = Slider(title="Phase", start=0, end=360, value=20, step=1, width=220)
animate = Toggle(label="Animate phase", active=True, button_type="success", width=150)

source = ColumnDataSource(data={"x": [], "y": [], "zero": []}, name="signal-source")
plot = figure(
    height=330,
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
)
metrics = Div(sizing_mode="stretch_width")

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
    metrics.text = f"""
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:4px 0 2px">
            <div style="background:#172033;border:1px solid #334155;border-radius:10px;padding:10px 14px;color:#94a3b8">
                Peak <strong style="color:#f8fafc;margin-left:8px">{peak:.2f}</strong>
            </div>
            <div style="background:#172033;border:1px solid #334155;border-radius:10px;padding:10px 14px;color:#94a3b8">
                RMS <strong style="color:#f8fafc;margin-left:8px">{rms:.2f}</strong>
            </div>
            <div style="background:#172033;border:1px solid #334155;border-radius:10px;padding:10px 14px;color:#94a3b8">
                Samples <strong style="color:#f8fafc;margin-left:8px">{len(samples)}</strong>
            </div>
        </div>
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
doc.add_periodic_callback(advance, 75)
doc.template = """
    {% block preamble %}
    <style>
      html, body { margin: 0; padding: 0; background: #0f172a; }
    </style>
    {% endblock %}
"""
doc.add_root(column(
    heading,
    row(waveform, animate, sizing_mode="stretch_width"),
    row(frequency, amplitude, phase, sizing_mode="stretch_width"),
    metrics,
    plot,
    sizing_mode="stretch_width",
    styles={"background": "#0f172a", "padding": "20px", "border-radius": "14px"},
))
doc.title = "Bokeh ASGI signal studio"
