''' A basic scatter plot with the toolbar positioned above the plot outside of the axes, titles, etc.
This example demonstrates a way to set the toolbar's location relative to the plot outside of the axes, titles, etc.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.toolbar_location, bokeh.plotting.figure.toolbar_sticky, bokeh.plotting.figure.scatter, bokeh.plotting.show
    :refs: :ref:`_ug_interaction_tools_toolbar`
    :keywords: position, location, sticky, toolbar
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400,
           title='Toolbar Location & Sticky Off', toolbar_location="above",
           toolbar_sticky=False)

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
