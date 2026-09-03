''' This example demonstrates mathtext units on automatically generated tick
labels.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.scatter, bokeh.models.ScaledTicker,
        bokeh.models.ScaledTickFormatter
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex
'''
from numpy import arange

from bokeh.models import ScaledTicker, ScaledTickFormatter
from bokeh.plotting import figure, show

x = arange(1, 4.5, 0.25)
y = 1 / x

plot = figure(width=650, height=250)
plot.title = "Current over Resistance at a static voltage of 1 volt"
plot.scatter(x, y, fill_color="blue", size=5)
plot.line(x, y, color="darkgrey")

plot.xaxis.axis_label = "Resistance"
plot.xaxis[0].ticker = ScaledTicker(scale=1)
plot.xaxis[0].formatter = ScaledTickFormatter(suffix=r"$$\,\Omega$$")

plot.yaxis.axis_label = "Current"
plot.yaxis[0].ticker = ScaledTicker(scale=1)
plot.yaxis[0].formatter = ScaledTickFormatter(suffix=r"$$\,\mathrm{A}$$")
plot.axis.major_label_standoff = 8
show(plot)
