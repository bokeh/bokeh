''' Bessel functions of the first kind. This example demonstrates the use of
mathtext on titles, ``Label`` annotations and axis labels.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.annotations.Label, bokeh.models.annotations.Title
    :refs: :ref:`userguide_styling` > :ref:`userguide_styling_math`
    :keywords: mathtext, latex

.. _Bessel functions: https://en.wikipedia.org/wiki/Bessel_function

'''
import numpy as np
from scipy.special import jv

from bokeh.io import curdoc, show
from bokeh.models import Label
from bokeh.palettes import YlOrRd4
from bokeh.plotting import figure

p = figure(
    width=700, height=500,
    title=\
        r"$$\color{white} \text{Bessel functions of the first kind: } J_\alpha(x) = \sum_{m=0}^{\infty}"
        r"\frac{(-1)^m}{m!\:\Gamma(m+\alpha+1)} \left(\frac{x}{2}\right)^{2m+\alpha}$$",
)
p.x_range.range_padding = 0
p.xaxis.axis_label = r"$$\color{white} x$$"
p.yaxis.axis_label = r"$$\color{white} J_\alpha(x)$$"
p.title.text_font_size="14px"

x = np.linspace(0.0, 14.0, 100)

for i, (xlabel, ylabel) in enumerate(zip([0.5, 1.6, 2.8, 4.2], [0.95, 0.6, 0.5, 0.45])):
    p.line(x, jv(i, x), line_width=3, color=YlOrRd4[i])
    p.add_layout(Label(text=r"$$\color{white} J_" + str(i) + "(x)$$", x=xlabel, y=ylabel))

curdoc().theme = 'night_sky'

show(p)
