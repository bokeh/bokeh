from __future__ import annotations

from typing import Any, cast

import numpy as np

from bokeh import palettes
from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div, GridBox, Range1d, Select, Slider, Toggle
from bokeh.plotting import figure

SAMPLES = np.linspace(0, 4, 2_001)
ZERO = np.zeros_like(SAMPLES)
MAX_TERMS = 15


def fourier_series(waveform: str, terms: int) -> tuple[np.ndarray, np.ndarray]:
    if waveform == "Sine":
        return np.array([1]), np.array([1.0])
    if waveform in ("Square", "Triangle"):
        harmonics = np.arange(1, 2*terms, 2)
        if waveform == "Square":
            coefficients = 4/(np.pi*harmonics)
        else:
            signs = np.where(np.arange(terms) % 2 == 0, 1, -1)
            coefficients = 8*signs/(np.pi**2*harmonics**2)
        return harmonics, coefficients

    harmonics = np.arange(1, terms + 1)
    signs = np.where(harmonics % 2 == 0, -1, 1)
    return harmonics, 2*signs/(np.pi*harmonics)


def modify_document(doc: Document) -> None:
    waveform = Select(
        title="Waveform",
        value="Square",
        options=["Sine", "Triangle", "Square", "Sawtooth"],
        sizing_mode="stretch_width",
        min_width=0,
        name="waveform",
    )
    frequency = Slider(
        title="Fundamental frequency",
        start=0.5,
        end=5,
        value=1.5,
        step=0.1,
        sizing_mode="stretch_width",
        min_width=0,
        name="frequency",
    )
    phase = Slider(
        title="Phase",
        start=0,
        end=360,
        value=20,
        step=1,
        sizing_mode="stretch_width",
        min_width=0,
        name="phase",
    )
    terms = Slider(
        title="Fourier terms",
        start=1,
        end=MAX_TERMS,
        value=6,
        step=1,
        sizing_mode="stretch_width",
        min_width=0,
        name="terms",
    )
    animate = Toggle(
        label="Animate phase",
        active=True,
        button_type="success",
        sizing_mode="stretch_width",
        min_width=0,
        align="end",
    )

    signal = ColumnDataSource(data={"x": [], "y": [], "zero": []}, name="signal-source")
    spectrum = ColumnDataSource(data={"harmonic": [], "magnitude": [], "color": []}, name="spectrum-source")

    signal_plot = figure(
        height=320,
        width=720,
        sizing_mode="stretch_width",
        min_width=0,
        output_backend="webgl",
        tools="pan,wheel_zoom,reset,save",
        toolbar_location="above",
        x_axis_label="Time (seconds)",
        y_axis_label="Amplitude",
        title="Fourier approximation",
    )
    signal_plot.varea(x="x", y1="zero", y2="y", source=signal, fill_color="#38bdf8", fill_alpha=0.12)
    signal_plot.line(x="x", y="y", source=signal, line_color="#38bdf8", line_width=3)

    spectrum_range = Range1d(0, 2)
    spectrum_plot = figure(
        height=320,
        width=380,
        sizing_mode="stretch_width",
        min_width=0,
        tools="",
        toolbar_location=None,
        x_range=(0, 2*MAX_TERMS),
        y_range=spectrum_range,
        x_axis_label="Harmonic",
        y_axis_label="Amplitude",
        title="Harmonic spectrum",
    )
    spectrum_plot.vbar(
        x="harmonic",
        top="magnitude",
        source=spectrum,
        width=0.72,
        fill_color="color",
        line_color=None,
    )

    for plot in (signal_plot, spectrum_plot):
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
                Live Python callbacks
            </div>
            <div style="color:#f8fafc;font-size:28px;font-weight:700;margin-top:5px">Fourier studio</div>
            <div style="color:#94a3b8;margin-top:5px">
                Build a waveform from harmonics and watch its signal and spectrum change together.
            </div>
        """,
        sizing_mode="stretch_width",
        min_width=0,
    )
    metric_styles: dict[str, str | None] = {
        "background": "#172033",
        "border": "1px solid #334155",
        "border-radius": "10px",
        "padding": "10px 14px",
    }
    peak_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)
    rms_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)
    terms_metric = Div(height=64, sizing_mode="stretch_width", min_width=0, styles=metric_styles)

    def update_data() -> None:
        harmonics, coefficients = fourier_series(waveform.value, int(terms.value))
        theta = 2*np.pi*frequency.value*SAMPLES + np.deg2rad(phase.value)
        y = np.sin(np.outer(theta, harmonics)) @ coefficients
        magnitudes = np.abs(coefficients)
        colors = [palettes.Turbo256[int(40 + 180*i/max(1, len(harmonics) - 1))] for i in range(len(harmonics))]

        signal.data = {"x": SAMPLES, "y": y, "zero": ZERO}
        spectrum.data = {"harmonic": harmonics, "magnitude": magnitudes, "color": colors}
        spectrum_range.end = max(1, 1.15*float(np.max(magnitudes)))
        if signal_plot.title is not None:
            signal_plot.title.text = f"{waveform.value} · {len(harmonics)} active harmonics"
        terms.disabled = waveform.value == "Sine"

        peak_metric.text = metric("Peak", f"{np.max(np.abs(y)):.2f}")
        rms_metric.text = metric("RMS", f"{np.sqrt(np.mean(np.square(y))):.2f}")
        terms_metric.text = metric("Components", str(len(harmonics)))

    def update(_attr: str, _old: Any, _new: Any) -> None:
        update_data()

    def advance() -> None:
        if animate.active:
            phase.value = (phase.value + 2) % 360

    for control in (waveform, frequency, phase, terms):
        control.on_change("value", update)

    controls = GridBox(
        children=[
            (waveform, 0, 0),
            (frequency, 0, 1),
            (terms, 0, 2),
            (phase, 1, 0, 1, 2),
            (animate, 1, 2),
        ],
        cols=cast(Any, ["minmax(0, 1fr)"]*3),
        spacing=cast(Any, 16),
        sizing_mode="stretch_width",
        styles={
            "background": "#e2e8f0",
            "border": "1px solid #94a3b8",
            "border-radius": "12px",
            "padding": "14px",
        },
    )
    metrics = GridBox(
        children=[(peak_metric, 0, 0), (rms_metric, 0, 1), (terms_metric, 0, 2)],
        cols=cast(Any, ["minmax(0, 1fr)"]*3),
        spacing=cast(Any, 12),
        sizing_mode="stretch_width",
    )
    plots = GridBox(
        children=[(signal_plot, 0, 0), (spectrum_plot, 0, 1)],
        cols=cast(Any, ["minmax(0, 2fr)", "minmax(0, 1fr)"]),
        spacing=cast(Any, 16),
        sizing_mode="stretch_width",
    )

    update_data()
    doc.theme = "dark_minimal"
    doc.add_periodic_callback(advance, 75)
    doc.add_root(column(
        heading,
        controls,
        metrics,
        plots,
        spacing=16,
        sizing_mode="stretch_width",
        styles={"background": "#0f172a", "padding": "20px", "border-radius": "14px"},
    ))
    doc.title = "Bokeh ASGI Fourier studio"


def metric(label: str, value: str) -> str:
    return f"""
        <div style="color:#94a3b8;font-size:12px;line-height:16px;text-transform:uppercase;letter-spacing:.08em">
            {label}
        </div>
        <strong style="color:#f8fafc;font-size:20px;line-height:24px">{value}</strong>
    """
