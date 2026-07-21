import numpy as np

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, CustomJS, Div, Range1d, Slider
from bokeh.plotting import figure, show


N = 400_000
MARKER_STRIDE = 20
N_MARKERS = len(range(0, N, MARKER_STRIDE))
N_PLOTTED = N + N_MARKERS
TOOLS = "pan,wheel_zoom,reset,save"


def style(plot):
    plot.background_fill_color = "#0f172a"
    plot.border_fill_color = "#020617"
    plot.outline_line_color = "#334155"
    plot.grid.grid_line_color = "#334155"
    plot.grid.grid_line_alpha = 0.45
    plot.axis.axis_line_color = "#64748b"
    plot.axis.major_tick_line_color = "#64748b"
    plot.axis.minor_tick_line_color = "#475569"
    plot.axis.major_label_text_color = "#cbd5e1"
    plot.title.text_color = "#f8fafc"


# Large absolute values with small local differences exercise origin rebasing.
start_ms = 1_720_000_000_000
duration_ms = 6*60*60*1000
t = np.linspace(0, 1, N)
datetime_x = start_ms + duration_ms*t
datetime_y = np.sin(2*np.pi*(7*t + 34*t**2)) + 0.22*np.cos(210*np.pi*t)
datetime_source = ColumnDataSource(data=dict(x=datetime_x, y=datetime_y))
datetime_dots = ColumnDataSource(data=dict(x=datetime_x[::MARKER_STRIDE], y=datetime_y[::MARKER_STRIDE]))

window_ms = 24*60*1000
datetime_range = Range1d(
    start=start_ms + duration_ms/2 - window_ms/2,
    end=start_ms + duration_ms/2 + window_ms/2,
)
datetime_plot = figure(
    width=620,
    height=430,
    x_axis_type="datetime",
    x_range=datetime_range,
    y_range=(-1.45, 1.45),
    output_backend="webgl",
    tools=TOOLS,
    active_scroll="wheel_zoom",
    title=f"Linear mapper · {N_PLOTTED:,} points · large-offset datetime",
)
datetime_plot.line("x", "y", source=datetime_source, line_color="#38bdf8", line_width=2, line_alpha=0.8)
datetime_plot.scatter(
    "x", "y", source=datetime_dots, size=3,
    fill_color="#e0f2fe", fill_alpha=0.45, line_alpha=0,
)
style(datetime_plot)

datetime_slider = Slider(
    start=12, end=348, value=180, step=1,
    title="Datetime window center (minutes)", width=590,
)
datetime_slider.js_on_change("value", CustomJS(args=dict(
    x_range=datetime_range,
    origin=start_ms,
    half_window=window_ms/2,
), code="""
    const center = origin + cb_obj.value*60_000
    x_range.setv({start: center - half_window, end: center + half_window})
"""))


# Logarithms are packed once. Subsequent range changes are affine transforms
# of the packed log-domain coordinates in the vertex shader.
log_exponent = np.linspace(-9, 15, N)
log_x = 10**log_exponent
log_y = 10**(1.7*np.sin(1.35*log_exponent) + 0.24*np.cos(8.5*log_exponent))
log_source = ColumnDataSource(data=dict(x=log_x, y=log_y))
log_dots = ColumnDataSource(data=dict(x=log_x[::MARKER_STRIDE], y=log_y[::MARKER_STRIDE]))

log_span = 4
log_range = Range1d(start=10**1, end=10**5)
log_plot = figure(
    width=620,
    height=430,
    x_axis_type="log",
    y_axis_type="log",
    x_range=log_range,
    y_range=(1e-2, 1e2),
    output_backend="webgl",
    tools=TOOLS,
    active_scroll="wheel_zoom",
    title=f"Log x log mapper · {N_PLOTTED:,} points · 24 decades",
)
log_plot.line("x", "y", source=log_source, line_color="#f59e0b", line_width=2, line_alpha=0.8)
log_plot.scatter(
    "x", "y", source=log_dots, size=3,
    fill_color="#fef3c7", fill_alpha=0.45, line_alpha=0,
)
style(log_plot)

log_slider = Slider(
    start=-7, end=13, value=3, step=0.1,
    title="Log window center (base-10 exponent)", width=590,
)
log_slider.js_on_change("value", CustomJS(args=dict(
    x_range=log_range,
    half_span=log_span/2,
), code="""
    x_range.setv({
        start: 10**(cb_obj.value - half_span),
        end: 10**(cb_obj.value + half_span),
    })
"""))


header = Div(text=f"""
<h2 style="margin: 0 0 8px 0; color: #f8fafc;">WebGL GPU mapper workbench</h2>
<p style="margin: 0; color: #cbd5e1; line-height: 1.45;">
Each plot renders <strong>{N_PLOTTED:,} points</strong>: {N:,} line points plus {N_MARKERS:,}
scatter markers.<br>
Drag either slider continuously, then pan and wheel-zoom. Range changes update six small
mapping uniforms per glyph; the packed coordinate buffers are neither remapped in JavaScript
nor uploaded again. The left plot demonstrates Float32 origin rebasing, while the right plot
performs the logarithmic transform once and maps the resulting log-domain deltas on the GPU.
</p>
""", width=1240)

layout = column(
    header,
    row(
        column(datetime_plot, datetime_slider),
        column(log_plot, log_slider),
    ),
)

show(layout)
