''' This example demonstrates the use of mathtext on tick labels through overwriting the labels
by adding a dictionary with pairs of position and mathtext.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex
'''
from numpy import arange

from bokeh.plotting import figure, show

x = arange(1, 4.5, 0.25)
y = 1 / x

plot = figure(height=200)
plot.title = "Current over Resistance at a static voltage of 1 volt"
plot.scatter(x, y, fill_color="blue", size=5)
plot.line(x, y, color="darkgrey")

plot.xaxis.axis_label = "Resistance"
plot.xaxis.ticker = [1, 2, 3, 4]
plot.xaxis.major_label_overrides = {
    1: r"1 $$\Omega$$",
    2: r"2 $$\Omega$$",
    3: r"3 $$\Omega$$",
    4: r"4 $$\Omega$$",
}

plot.yaxis.axis_label = "Current"
plot.yaxis.ticker = [0.2, 0.4, 0.6, 0.8, 1.0]
plot.yaxis.major_label_overrides = {
    0.2: "0.2 $$A$$",
    0.4: "0.4 $$A$$",
    0.6: "0.6 $$A$$",
    0.8: "0.8 $$A$$",
    1: "1 $$A$$",
}
show(plot)
