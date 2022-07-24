
from bokeh.models import NumericInput
from bokeh.io import show

numeric_input = NumericInput(value=1, low=1, high=10, title="Enter a number between 1 and 10:")

show(numeric_input)
