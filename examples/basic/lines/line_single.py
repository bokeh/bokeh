''' A line graph using user-defined data points. This example
demonstrates the use of the ``line`` method to make a graph
by drawing straight lines between defined points.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line
    :refs: :ref:`ug_basic_lines_single`
    :keywords: line, glyph

'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a line renderer
p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)

show(p)
