''' A basic line plot with the toolbar set to autohide.
This example demonstrates a way to hide the toolbar when
the cursor is outside the plot.

.. bokeh-example-metadata::
    :apis: bokeh.models.Toolbar.autohide, bokeh.plotting.figure.line, bokeh.plotting.show
    :refs: :ref:`ug_interaction_tools_autohide`
    :keywords: autohide, toolbar
'''

from bokeh.plotting import figure, show

# Basic plot setup
plot = figure(width=400, height=400, title='Toolbar Autohide')
plot.line([1,2,3,4,5], [2,5,8,2,7])

# Set autohide to true to only show the toolbar when mouse is over plot
plot.toolbar.autohide = True

show(plot)
