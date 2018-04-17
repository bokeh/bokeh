import numpy as np

from bokeh.plotting import figure
from bokeh.layouts import row
from bokeh.io import save

def make_figure(output_backend):
    x = np.linspace(0.1, 5, 100)

    p = figure(y_axis_type="log",
               y_range=(0.001, 10**22),
               plot_width=400,
               plot_height=400,
               toolbar_location=None,
               output_backend=output_backend,
               title="Backend: %s" % output_backend)

    p.xaxis.axis_label = 'Domain'
    p.yaxis.axis_label = 'Values (log scale)'

    p.line(x, np.sqrt(x), line_color="tomato", line_dash="dotdash")
    p.line(x, x)
    p.circle(x, x)
    p.line(x, x**2)
    p.circle(x, x**2, fill_color=None, line_color="olivedrab")
    p.line(x, 10**x, line_color="gold", line_width=2)
    p.line(x, x**x, line_dash="dotted", line_color="indigo", line_width=2)
    p.line(x, 10**(x**2), line_color="coral", line_dash="dashed", line_width=2)

    return p

canvas = make_figure("canvas")
webgl  = make_figure("webgl")
svg    = make_figure("svg")

save(row(canvas, webgl, svg))
