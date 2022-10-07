''' A histogram plot of the Normal (Gaussian) distribution.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.quad
    :refs: :ref:`ug_topics_stats_histogram`
    :keywords: histogram

'''
import numpy as np

from bokeh.plotting import figure, show

rng = np.random.default_rng()
x = rng.normal(loc=0, scale=1, size=1000)

p = figure(width=670, height=400, toolbar_location=None,
           title="Normal (Gaussian) Distribution")

# Histogram
bins = np.linspace(-3, 3, 40)
hist, edges = np.histogram(x, density=True, bins=bins)
p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
         fill_color="skyblue", line_color="white",
         legend_label="1000 random samples")

# Probability density function
x = np.linspace(-3.0, 3.0, 100)
pdf = np.exp(-0.5*x**2) / np.sqrt(2.0*np.pi)
p.line(x, pdf, line_width=2, line_color="navy",
       legend_label="Probability Density Function")

p.y_range.start = 0
p.xaxis.axis_label = "x"
p.yaxis.axis_label = "PDF(x)"

show(p)
