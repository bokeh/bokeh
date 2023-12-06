''' This example demonstrates a basic scatter plot with the toolbar
positioned below the plot, outside of the axes, titles, etc.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.toolbar_location, bokeh.plotting.figure.toolbar_sticky, bokeh.plotting.figure.scatter, bokeh.plotting.show
    :refs: :ref:`ug_interaction_tools_toolbar`
    :keywords: position, location, sticky, toolbar
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400,
           title=None, toolbar_location="below",
           toolbar_sticky=False)

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
