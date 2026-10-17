''' A plot of the Normal (Gaussian) distribution. This example demonstrates the
use of mathtext on axes and in ``Div`` objects.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.quad, bokeh.models.Div, bokeh.models.TeX,
        bokeh.models.ScaledTicker, bokeh.models.ScaledTickFormatter
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

'''
import numpy as np

from bokeh.layouts import column
from bokeh.models import (Div, ScaledTicker, ScaledTickFormatter,
                          SingleIntervalTicker, TeX)
from bokeh.plotting import figure, show

p = figure(width=670, height=400, toolbar_location=None,
           title="Normal (Gaussian) Distribution")
p.y_range.start = 0

n = 1000
rng = np.random.default_rng(825914)
samples = rng.normal(loc=4.7, scale=12.3, size=n)

xbar = samples.mean()
sigma = samples.std()

# Histogram in the original data coordinates
bins = np.linspace(xbar - 3*sigma, xbar + 3*sigma, 40)
hist, edges = np.histogram(samples, density=True, bins=bins)
p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
         fill_color="skyblue", line_color="white",
         legend_label=f"{n} random samples")

# Probability density function
x = np.linspace(xbar - 3*sigma, xbar + 3*sigma, 100)
z = (x - xbar) / sigma
pdf = np.exp(-0.5*z**2) / (sigma*np.sqrt(2.0*np.pi))
p.line(x, pdf, line_width=2, line_color="navy",
       legend_label="Probability Density Function")

p.xaxis.axis_label = "x"
p.yaxis.axis_label = "PDF(x)"

p.xaxis[0].ticker = ScaledTicker(
    scale=sigma,
    offset=xbar,
    ticker=SingleIntervalTicker(interval=1),
)
p.xaxis[0].formatter = ScaledTickFormatter(
    origin_label=TeX(text=r"\overline{x}"),
    unit=TeX(text=r"\sigma"),
    unit_style="symbolic",
)

p.yaxis[0].ticker = ScaledTicker(scale=1/sigma, desired_num_ticks=5)
p.yaxis[0].formatter = ScaledTickFormatter(
    unit=TeX(text=r"\,\sigma^{-1}"),
    unit_style="except_zero",
)

div = Div(text=r"""
A histogram of a samples from a Normal (Gaussian) distribution, together with
the ideal probability density function, given by the equation:
<p />
$$
\qquad PDF(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{1}{2}
\left(\frac{x-\overline{x}}{\sigma}\right)^2 \right]
$$
""")

show(column(p, div))
