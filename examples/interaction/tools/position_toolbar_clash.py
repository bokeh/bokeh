''' A basic scatter plot with the toolbar positioned below the plot.
This example demonstrates a way to set the toolbar's location relative
to the edge of the plot.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.toolbar_location, bokeh.plotting.figure.scatter, bokeh.plotting.show
    :refs: :ref:`ug_interaction_tools_toolbar`
    :keywords: position, location, toolbar
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400,
           title=None, toolbar_location="below")

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
