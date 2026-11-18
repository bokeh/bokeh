''' Enter a numeric value in a widget.

.. bokeh-example-metadata::
    :title: Numericinput
    :keywords: numericinput, interaction, widgets
    :apis: bokeh.models.NumericInput
'''

from bokeh.io import show
from bokeh.models import NumericInput

numeric_input = NumericInput(value=1, low=1, high=10, title="Enter a number between 1 and 10:")

show(numeric_input)
