''' This example demonstrates the use of mathtext on tick labels through overwriting the labels
by adding a dictionary with pairs of position and mathtext.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.circle
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex
'''
from numpy import arange

from bokeh.plotting import figure, show

x = arange(1, 4.5, 0.25)
y = 1 / x

plot = figure(height=200)
plot.circle(x, y, fill_color="blue", size=5)
plot.line(x, y, color="darkgrey")

plot.xaxis.axis_label = "Resistance"
plot.xaxis.ticker = [1, 2, 3, 4]
plot.yaxis.axis_label = "Current at 1 V"

plot.xaxis.major_label_overrides = {
    1: r"$$1\ \Omega$$",
    2: r"$$2\ \Omega$$",
    3: r"$$3\ \Omega$$",
    4: r"$$4\ \Omega$$",
}

show(plot)
