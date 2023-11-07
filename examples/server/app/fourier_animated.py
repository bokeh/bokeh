""" Show a streaming, animated representation of Fourier Series.

The example was inspired by `this video`_.

Use the ``bokeh serve`` command to run the example by executing:

    bokeh serve fourier_animated.py

at your command prompt. Then navigate your browser to the URL

    http://localhost:5006/fourier_animated

.. _this video: https://www.youtube.com/watch?v=LznjC4Lo7lE

"""
from numpy import array, cos, cumsum, hstack, linspace, pi, roll, sin

from bokeh.driving import repeat
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import CDSView, ColumnDataSource, IndexFilter
from bokeh.plotting import figure

palette = ("#08519c", "#3182bd", "#6baed6", "#bdd7e7")
dashing = ("dotted", "solid", "solid", "solid")

N = 100
x = linspace(0, 2*pi, N, endpoint=False)
xoff = 2.5
xend = xoff + 2*pi*(N-1)/N
A = 4/pi * array([1, 1/3, 1/5, 1/7])
w = array([1, 3, 5, 7])

lines_source = ColumnDataSource({f"y{i}": A[i] * sin(w[i]*x) for i in range(len(A))})
lines_source.data["y"] = sum(lines_source.data.values())
lines_source.data["x"] = x + xoff

def update_term_data(i):
    x, y = A * cos(2*pi*w*i/N), A * sin(2*pi*w*i/N)
    xsum, ysum = hstack([[0], cumsum(x)]), hstack([[0], cumsum(y)])
    return { "xterm-dot": x,
             "yterm-dot": y,
             "xterm-line": [[0, xx, 2.5] for xx in x],
             "yterm-line": [[0, yy, yy] for yy in y],
             "xsum-dot": xsum[1:],
             "ysum-dot": ysum[1:],
             "xsum-circle": xsum[:-1],
             "ysum-circle": ysum[:-1] }

items_source = ColumnDataSource({"r": A, "color": palette, "dashing": dashing})
items_source.data.update(update_term_data(0))

terms_plot = figure(title="First four square-wave harmonics, individually",
                    height=400, width=820, x_range=(-2.5, xend), y_range=(-2.5, 2.5),
                    tools="", toolbar_location=None)

terms_plot.circle(0, 0, radius=A, color=palette, line_width=2, line_dash=dashing, fill_color=None)

for i in range(4):
    legend_label = f"4sin({i*2+1}x)/{i*2+1}pi" if i else "4sin(x)/pi"
    terms_plot.line("x", f"y{i}", color=palette[i], line_width=2,
                    source=lines_source, legend_label=legend_label)

terms_plot.scatter("xterm-dot", "yterm-dot", size=5, color="color", source=items_source)

terms_plot.multi_line("xterm-line", "yterm-line", color="color", source=items_source)

terms_plot.xgrid.bounds = terms_plot.xaxis.bounds = (-2.5, 2.5)
terms_plot.axis.ticker.desired_num_ticks = 8
terms_plot.legend.location = "top_right"
terms_plot.legend.orientation = "horizontal"

sum_plot = figure(title="First four square-wave harmonics, summed",
                  height=400, width=820, x_range=(-2.5, xend), y_range=(-2.5, 2.5),
                  tools="", toolbar_location=None)

sum_plot.line("x", "y", color="orange", line_width=2, source=lines_source)

sum_plot.circle("xsum-circle", "ysum-circle", radius="r",
                line_color="color", line_width=2, line_dash="dashing",
                fill_color=None, source=items_source)

sum_plot.scatter("xsum-dot", "ysum-dot", size=5, color="color", source=items_source)

segment_view = CDSView(filter=IndexFilter([3]))
sum_plot.segment(x0="xsum-dot", y0="ysum-dot", x1=2.5, y1="ysum-dot",
                 color="orange", source=items_source, view=segment_view)

sum_plot.xgrid.bounds = sum_plot.xaxis.bounds = (-2.5, 2.5)
sum_plot.axis.ticker.desired_num_ticks = 8

@repeat(range(N))
def update(ind):
    ykeys = (k for k in lines_source.data.keys() if k.startswith("y"))
    lines_source.data.update({y: roll(lines_source.data[y], -1) for y in ykeys})
    items_source.data.update(update_term_data(ind))

curdoc().add_periodic_callback(update, 100)
curdoc().title = "Fourier Animated"
curdoc().add_root(column(terms_plot, sum_plot))
