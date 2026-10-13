import numpy as np

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, CustomJS, Div, Slider
from bokeh.plotting import figure, show


def style_plot(plot):
    plot.background_fill_color = "#f8fafc"
    plot.outline_line_color = None
    plot.grid.grid_line_alpha = 0.25
    plot.title.text_color = "#334155"


def bollinger():
    rng = np.random.default_rng(7)
    x = np.arange(100)
    center = 100 + np.cumsum(rng.normal(0, 0.8, size=100))
    spread = 8 + 2*np.sin(x/12)
    upper = center + spread
    lower = center - spread

    plot = figure(
        width=1120, height=260,
        title="Bollinger band overview",
        x_axis_label="Observation", y_axis_label="Value",
        tools="pan,wheel_zoom,reset", active_scroll="wheel_zoom",
    )
    plot.varea(x, lower, upper, color="#6366f1", fill_alpha=0.16)
    plot.line(x, center, color="#4338ca", line_width=2)
    style_plot(plot)

    return plot


def slider():
    x = np.linspace(0, 10, 100)
    y = np.sin(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(
        width=836, height=300, y_range=(-10, 10),
        tools="", toolbar_location=None,
        title="Parameterized sine wave",
    )
    plot.line("x", "y", source=source, line_width=3, line_color="#0f766e")
    style_plot(plot)

    amp = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude")
    freq = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency")
    phase = Slider(start=0, end=6.4, value=0, step=.1, title="Phase")
    offset = Slider(start=-5, end=5, value=0, step=.1, title="Offset")

    callback = CustomJS(args=dict(source=source, amp=amp, freq=freq, phase=phase, offset=offset),
                        code="""
        const A = amp.value
        const k = freq.value
        const phi = phase.value
        const B = offset.value

        const x = source.data.x
        const y = Array.from(x, (x) => B + A*Math.sin(k*x+phi))
        source.data = {x, y}
    """)

    amp.js_on_change('value', callback)
    freq.js_on_change('value', callback)
    phase.js_on_change('value', callback)
    offset.js_on_change('value', callback)

    widgets = column(amp, freq, phase, offset, width=270, spacing=8)

    return widgets, plot


def linked_panning():
    x = np.linspace(0, 4 * np.pi, 100)
    y1 = np.sin(x)
    y2 = np.cos(x)
    y3 = np.sin(x) + np.cos(x)

    s1 = figure(width=360, height=250, title="sin(x)", tools="pan,reset")
    s1.line(x, y1, color="#2563eb", line_width=2)

    s2 = figure(
        width=360, height=250, title="cos(x)", tools="pan,reset",
        x_range=s1.x_range, y_range=s1.y_range,
    )
    s2.line(x, y2, color="#dc2626", line_width=2)

    s3 = figure(
        width=360, height=250, title="sin(x) + cos(x)", tools="pan,reset",
        x_range=s1.x_range,
    )
    s3.line(x, y3, color="#7c3aed", line_width=2)

    for plot in (s1, s2, s3):
        style_plot(plot)

    return s1, s2, s3


header = Div(text="""
<h1 style="margin: 0 0 0.2em; color: #1e293b">Interactive signal dashboard</h1>
<p style="margin: 0; color: #64748b">
Explore the overview, tune a generated signal, and pan the linked plots to compare related functions.
</p>
""", width=1120)

slider_controls, slider_plot = slider()
linked_plots = linked_panning()

layout = column(
    header,
    bollinger(),
    Div(text="<h2 style='margin: 0; color: #334155'>Signal controls</h2>", width=1120),
    row(slider_controls, slider_plot, spacing=14),
    Div(text="<h2 style='margin: 0; color: #334155'>Linked panning</h2>", width=1120),
    row(*linked_plots, spacing=14),
    width=1120,
    spacing=14,
)

show(layout)
