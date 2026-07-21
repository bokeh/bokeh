import numpy as np

from bokeh.layouts import column
from bokeh.plotting import figure, show


# These plots deliberately use enough vertices for range remapping costs to be
# visible. With WebGL, panning and zooming update a few scale uniforms; the
# packed data-coordinate buffers remain unchanged on the GPU.
n = 250_000

start_ms = 1_720_000_000_000
datetime_x = start_ms + np.linspace(0, 60_000, n)
datetime_y = np.sin(np.linspace(0, 160*np.pi, n))

datetime_plot = figure(
    width=1000,
    height=360,
    x_axis_type="datetime",
    output_backend="webgl",
    tools="pan,wheel_zoom,reset,save",
    active_scroll="wheel_zoom",
    title="250k datetime points — pan/zoom uses precision-rebased GPU mapping",
)
datetime_plot.line(datetime_x, datetime_y, line_width=2, line_alpha=0.7)
datetime_plot.scatter(datetime_x[::4], datetime_y[::4], size=3, fill_alpha=0.25, line_alpha=0)

log_x = np.geomspace(1, 1e12, n)
log_y = 2 + np.sin(np.log(log_x)*4)

log_plot = figure(
    width=1000,
    height=360,
    x_axis_type="log",
    output_backend="webgl",
    tools="pan,wheel_zoom,reset,save",
    active_scroll="wheel_zoom",
    title="250k log-axis points — logarithms are packed once, then mapped in the vertex shader",
)
log_plot.line(log_x, log_y, line_color="#d97706", line_width=2)

show(column(datetime_plot, log_plot))
