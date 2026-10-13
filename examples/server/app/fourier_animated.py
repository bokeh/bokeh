"""Show how rotating Fourier terms build a square wave.

Run this example with::

    bokeh serve fourier_animated.py

Then open ``http://localhost:5006/fourier_animated`` in a browser.
"""

from numpy import array, cos, cumsum, hstack, linspace, pi, sin

from bokeh.driving import repeat
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div
from bokeh.plotting import figure

samples = 200
angles = linspace(0, 2*pi, samples, endpoint=False)
harmonics = array([1, 3, 5, 7])
amplitudes = 4/(pi*harmonics)
colors = ("#08519c", "#3182bd", "#6baed6", "#bdd7e7")
wave_start = 2.75


def frame(index):
    phase = 2*pi*index/samples
    dx = amplitudes*cos(harmonics*phase)
    dy = amplitudes*sin(harmonics*phase)
    tip_x = cumsum(dx)
    tip_y = cumsum(dy)
    center_x = hstack([[0], tip_x[:-1]])
    center_y = hstack([[0], tip_y[:-1]])

    wave = (amplitudes[:, None]*sin(harmonics[:, None]*(angles + phase))).sum(axis=0)
    curve_x = hstack([[tip_x[-1], wave_start], wave_start + angles])
    curve_y = hstack([[tip_y[-1], tip_y[-1]], wave])

    epicycles = dict(center_x=center_x, center_y=center_y, tip_x=tip_x, tip_y=tip_y)
    curve = dict(x=curve_x, y=curve_y)
    return epicycles, curve


epicycle_data, curve_data = frame(0)
epicycles = ColumnDataSource(dict(
    radius=amplitudes,
    color=colors,
    **epicycle_data,
))
curve = ColumnDataSource(curve_data)

plot = figure(
    height=520,
    max_width=1000,
    sizing_mode="stretch_width",
    x_range=(-2.1, wave_start + 2*pi),
    y_range=(-1.8, 1.8),
    tools="",
    toolbar_location=None,
    title="Four odd harmonics tracing a square-wave approximation",
    background_fill_color="#f7f9fc",
    outline_line_color="#d9e1ea",
)

plot.circle(
    "center_x", "center_y", radius="radius",
    line_color="color", line_width=2, fill_color=None,
    source=epicycles,
)
plot.segment(
    "center_x", "center_y", "tip_x", "tip_y",
    line_color="color", line_width=2,
    source=epicycles,
)
plot.scatter("tip_x", "tip_y", size=7, color="color", source=epicycles)
plot.line("x", "y", color="#f28e2b", line_width=3, source=curve)
plot.axis.visible = False
plot.grid.visible = False

intro = Div(text="""
<h2 style="margin: 0 0 0.35em">Building a square wave</h2>
<p style="margin: 0">Each circle is one odd Fourier harmonic. Their rotating
vectors add tip-to-tail; the orange trace begins at the final tip and shows the
resulting approximation. Every frame is computed by a Python server callback.</p>
""", max_width=1000, sizing_mode="stretch_width")


@repeat(range(samples))
def update(index):
    epicycle_data, curve_data = frame(index)
    epicycles.data.update(epicycle_data)
    curve.data = curve_data


doc = curdoc()
doc.add_periodic_callback(update, 60)
doc.title = "Fourier Animated"
doc.add_root(column(intro, plot, max_width=1000, sizing_mode="stretch_width"))
