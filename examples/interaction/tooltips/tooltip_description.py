''' A visualization of Multichoice tooltips in bokeh.models.

This example demonstrates user input text box where the user can input from a
list of various options of elements to choose one or more of them, and then
clear the choices as well.

.. bokeh-example-metadata::
    :apis: bokeh.io.show, bokeh.models.MultiChoice, Bokeh.models.Tooltip
    :refs: `ug_interaction_widgets_examples_multichoice`
    :keywords: tooltip, multichoice
'''
from bokeh.io import show
from bokeh.models import MultiChoice, Tooltip

OPTIONS = ["apple", "mango", "banana", "tomato"]

tooltip = Tooltip(content="Choose any number of the items", position="right")

multi_choice = MultiChoice(value=OPTIONS[:2], options=OPTIONS, title="Choose values:", description=tooltip)

show(multi_choice)
