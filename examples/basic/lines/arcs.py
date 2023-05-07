''' An arc graph using pre-defined data points. This example
demonstrates the use of the ``arc`` method to make a graph
by drawing three arcs of defined radius, start and end angles
at a specified point.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.arc
    :refs: :ref:`ug_basic_lines_arcs`
    :keywords: arc, figure, glyph

'''
from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.arc(x=[1, 2, 3], y=[1, 2, 3], radius=0.1, start_angle=0.4, end_angle=4.8, color="navy")

show(p)
