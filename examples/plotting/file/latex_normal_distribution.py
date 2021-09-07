import numpy as np

from bokeh.models import FixedTicker, TeX
from bokeh.plotting import figure, show

fig = figure(width=650, height=400, toolbar_location=None, title="Normal (Gaussian) Distribution")
fig.min_border_bottom = 50

n = 1000
rng = np.random.default_rng(825914)
x = rng.normal(loc=4.7, scale=12.3, size=n)

# Scale random data so that it has mean of 0 and standard deviation of 1.
xbar = x.mean()
sigma = x.std()
scaled = (x - xbar) / sigma

# Histogram.
bins = np.linspace(-3, 3, 40)
hist, edges = np.histogram(scaled, density=True, bins=bins)
fig.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
         fill_color="skyblue", line_color="white", legend_label=f"{n} random samples")

# Probability density function.
x = np.linspace(-3.0, 3.0, 100)
pdf = np.exp(-0.5*x**2) / np.sqrt(2.0*np.pi)
fig.line(x, pdf, line_width=2, line_color="navy", legend_label="Probability Density Function")

fig.xaxis.axis_label = TeX(text=r"x")
fig.yaxis.axis_label = TeX(
    text=r"PDF(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{1}{2} "
    r"\left(\frac{x-\overline{x}}{\sigma}\right)^2 \right]")

fig.xaxis.ticker = FixedTicker(ticks=[-3, -2, -1, 0, 1, 2, 3])
fig.xaxis.major_label_overrides = {
    -3: TeX(text=r"\overline{x} - 3\sigma"),
    -2: TeX(text=r"\overline{x} - 2\sigma"),
    -1: TeX(text=r"\overline{x} - \sigma"),
    0: TeX(text=r"\overline{x}"),
    1: TeX(text=r"\overline{x} + \sigma"),
    2: TeX(text=r"\overline{x} + 2\sigma"),
    3: TeX(text=r"\overline{x} + 3\sigma"),
}

fig.yaxis.ticker = FixedTicker(ticks=[0, 0.1, 0.2, 0.3, 0.4])
fig.yaxis.major_label_overrides = {
    0: TeX(text=r"0"),
    0.1: TeX(text=r"0.1/\sigma"),
    0.2: TeX(text=r"0.2/\sigma"),
    0.3: TeX(text=r"0.3/\sigma"),
    0.4: TeX(text=r"0.4/\sigma"),
}

show(fig)
