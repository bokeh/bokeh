''' This example demonstrates the use of inline mathtext on titles and ``Label`` annotations.
This example makes use of all the three LaTeX delimiters pairs ``$$...$$``, ``\\[...\\]`` and
``\\(...\\)``.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.Label
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex
'''
from numpy import arange, pi, sin

from bokeh.models.annotations.labels import Label
from bokeh.plotting import figure, show

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)

p = figure(height=250, title=r"$$\sin(x)$$ for \[x\] between \(-2\pi\) and $$2\pi$$")
p.scatter(x, y, alpha=0.6, size=7)

label = Label(
    text=r"$$y = \sin(x)$$",
    x=150, y=130,
    x_units="screen", y_units="screen",
)
p.add_layout(label)

p.yaxis.axis_label = r"\(\sin(x)\)"
p.xaxis.axis_label = r"\[x\pi\]"

show(p)
