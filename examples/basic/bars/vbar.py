''' Draw vertical bars from a shared baseline to individual heights.

.. bokeh-example-metadata::
    :title: Vbar
    :keywords: vbar
    :apis: bokeh.plotting.figure.vbar
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.vbar(x=[1, 2, 3], width=0.5, bottom=0,
       top=[1.2, 2.5, 3.7], color="firebrick")

show(p)
