''' Bessel functions of the first kind. This example demonstrates the use of
mathtext on titles, ``Label`` annotations and axis labels.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.Label, bokeh.models.Title
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

.. _Bessel functions: https://en.wikipedia.org/wiki/Bessel_function

'''
import numpy as np
from scipy.special import jv

from bokeh.models import Label
from bokeh.palettes import YlOrRd4
from bokeh.plotting import curdoc, figure, show

p = figure(
    width=700, height=500,
    title=(
        r"Bessel functions of the first kind: $$J_\alpha(x) = \sum_{m=0}^{\infty}"
        r"\frac{(-1)^m}{m!\:\Gamma(m+\alpha+1)} \left(\frac{x}{2}\right)^{2m+\alpha}$$"
    ),
)
p.x_range.range_padding = 0
p.xaxis.axis_label = "$$x$$"
p.xaxis.axis_label_text_color = "white"
p.yaxis.axis_label = r"$$J_\alpha(x)$$"
p.yaxis.axis_label_text_color = "white"
p.title.text_font_size = "14px"
p.title.text_color = "white"

x = np.linspace(0.0, 14.0, 100)

for i, (xlabel, ylabel) in enumerate(zip([0.5, 1.6, 2.8, 4.2], [0.95, 0.6, 0.5, 0.45])):
    p.line(x, jv(i, x), line_width=3, color=YlOrRd4[i])
    p.add_layout(Label(text=f"$$J_{i}(x)$$", x=xlabel, y=ylabel, text_color="white"))

curdoc().theme = 'night_sky'

show(p)
