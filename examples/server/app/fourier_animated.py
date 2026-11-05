"""Show an animated representation of a square-wave Fourier series.

Run this example with::

    bokeh serve fourier_animated.py

Then open ``http://localhost:5006/fourier_animated`` in a browser.
"""

from numpy import array, cos, cumsum, hstack, linspace, pi, sin

from bokeh.driving import repeat
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure

samples = 100
angles = linspace(0, 2*pi, samples, endpoint=False)
harmonics = array([1, 3, 5, 7])
amplitudes = 4/(pi*harmonics)
colors = ("#08519c", "#3182bd", "#6baed6", "#bdd7e7")
dashes = ("dotted", "solid", "solid", "solid")
wave_start = 2.5
wave_x = wave_start + angles


def frame(index):
    phase = 2*pi*index/samples
    term_x = amplitudes*cos(harmonics*phase)
    term_y = amplitudes*sin(harmonics*phase)
    sum_x = cumsum(term_x)
    sum_y = cumsum(term_y)
    components = amplitudes[:, None]*sin(harmonics[:, None]*(angles + phase))

    items = dict(
        term_x=term_x,
        term_y=term_y,
        term_xs=[[0, x, wave_start] for x in term_x],
        term_ys=[[0, y, y] for y in term_y],
        center_x=hstack([[0], sum_x[:-1]]),
        center_y=hstack([[0], sum_y[:-1]]),
        sum_x=sum_x,
        sum_y=sum_y,
    )
    waves = {f"y{i}": component for i, component in enumerate(components)}
    total = components.sum(axis=0)
    curve = dict(
        x=hstack([[sum_x[-1], wave_start], wave_x]),
        y=hstack([[sum_y[-1], sum_y[-1]], total]),
    )
    return items, waves, curve


item_data, wave_data, curve_data = frame(0)
items = ColumnDataSource(dict(radius=amplitudes, color=colors, dash=dashes, **item_data))
waves = ColumnDataSource(dict(x=wave_x, **wave_data))
curve = ColumnDataSource(curve_data)

terms_plot = figure(
    title="First four square-wave harmonics, individually",
    height=400,
    width=820,
    x_range=(-2.5, wave_x[-1]),
    y_range=(-2.5, 2.5),
    tools="",
    toolbar_location=None,
)

terms_plot.circle(0, 0, radius=amplitudes, color=colors, line_width=2, line_dash=dashes, fill_color=None)
for i, harmonic in enumerate(harmonics):
    label = f"4sin({harmonic}x)/{harmonic}pi" if harmonic != 1 else "4sin(x)/pi"
    terms_plot.line("x", f"y{i}", color=colors[i], line_width=2, source=waves, legend_label=label)
terms_plot.scatter("term_x", "term_y", size=5, color="color", source=items)
terms_plot.multi_line("term_xs", "term_ys", color="color", source=items)
terms_plot.xgrid.bounds = terms_plot.xaxis.bounds = (-2.5, 2.5)
terms_plot.axis.ticker.desired_num_ticks = 8
terms_plot.legend.location = "top_right"
terms_plot.legend.orientation = "horizontal"

sum_plot = figure(
    title="First four square-wave harmonics, summed",
    height=400,
    width=820,
    x_range=(-2.5, wave_x[-1]),
    y_range=(-2.5, 2.5),
    tools="",
    toolbar_location=None,
)

sum_plot.line("x", "y", color="orange", line_width=2, source=curve)
sum_plot.circle(
    "center_x", "center_y", radius="radius",
    line_color="color", line_width=2, line_dash="dash", fill_color=None,
    source=items,
)
sum_plot.scatter("sum_x", "sum_y", size=5, color="color", source=items)
sum_plot.xgrid.bounds = sum_plot.xaxis.bounds = (-2.5, 2.5)
sum_plot.axis.ticker.desired_num_ticks = 8


@repeat(range(samples))
def update(index):
    item_data, wave_data, curve_data = frame(index)
    items.data.update(item_data)
    waves.data.update(wave_data)
    curve.data = curve_data


curdoc().add_periodic_callback(update, 100)
curdoc().title = "Fourier Animated"
curdoc().add_root(column(terms_plot, sum_plot))
