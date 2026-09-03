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
from bokeh.models import DataRange1d, Div, FixedTicker, ScaledTicker, ScaledTickFormatter, TeX
from bokeh.plotting import figure, show

p = figure(width=670, height=400, toolbar_location=None, y_range=DataRange1d(start=0),
           title="Normal (Gaussian) Distribution")

n = 1000
rng = np.random.default_rng(825914)
x = rng.normal(loc=4.7, scale=12.3, size=n)

# Scale random data so that it has mean of 0 and standard deviation of 1
xbar = x.mean()
sigma = x.std()
scaled = (x - xbar) / sigma

# Histogram
bins = np.linspace(-3, 3, 40)
hist, edges = np.histogram(scaled, density=True, bins=bins)
p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
         fill_color="skyblue", line_color="white",
         legend_label=f"{n} random samples")

# Probability density function
x = np.linspace(-3.0, 3.0, 100)
pdf = np.exp(-0.5*x**2) / np.sqrt(2.0*np.pi)
p.line(x, pdf, line_width=2, line_color="navy",
       legend_label="Probability Density Function")

p.xaxis.axis_label = "x"
p.yaxis.axis_label = "PDF(x)"

p.xaxis[0].ticker = ScaledTicker(
    scale=1,
    ticker=FixedTicker(ticks=[-3, -2, -1, 0, 1, 2, 3]),
)
p.xaxis[0].formatter = ScaledTickFormatter(
    base_label=TeX(text=r"\overline{x}"),
    suffix=TeX(text=r"\sigma"),
    unit_style="symbolic",
)

p.yaxis[0].ticker = ScaledTicker(scale=1, desired_num_ticks=5)
p.yaxis[0].formatter = ScaledTickFormatter(
    suffix=TeX(text=r"/\sigma"),
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
