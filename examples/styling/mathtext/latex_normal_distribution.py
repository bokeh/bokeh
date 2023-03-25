''' A plot of the Normal (Gaussian) distribution. This example demonstrates the
use of mathtext on axes and in ``Div`` objects.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.quad, bokeh.models.Div, bokeh.models.TeX
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

'''
import numpy as np

from bokeh.layouts import column
from bokeh.models import Div, TeX
from bokeh.plotting import figure, show

p = figure(width=670, height=400, toolbar_location=None,
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

p.y_range.start = 0
p.xaxis.axis_label = "x"
p.yaxis.axis_label = "PDF(x)"

p.xaxis.ticker = [-3, -2, -1, 0, 1, 2, 3]
p.xaxis.major_label_overrides = {
    -3: TeX(r"\overline{x} - 3\sigma"),
    -2: TeX(r"\overline{x} - 2\sigma"),
    -1: TeX(r"\overline{x} - \sigma"),
     0: TeX(r"\overline{x}"),
     1: TeX(r"\overline{x} + \sigma"),
     2: TeX(r"\overline{x} + 2\sigma"),
     3: TeX(r"\overline{x} + 3\sigma"),
}

p.yaxis.ticker = [0, 0.1, 0.2, 0.3, 0.4]
p.yaxis.major_label_overrides = {
    0: TeX(r"0"),
    0.1: TeX(r"0.1/\sigma"),
    0.2: TeX(r"0.2/\sigma"),
    0.3: TeX(r"0.3/\sigma"),
    0.4: TeX(r"0.4/\sigma"),
}

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
