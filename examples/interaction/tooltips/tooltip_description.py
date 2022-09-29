from bokeh.io import show
from bokeh.models import MultiChoice, Tooltip

OPTIONS = ["foo", "bar", "baz", "quux"]

tooltip = Tooltip(content="Choose any number of the predefined items", position="right")

multi_choice = MultiChoice(value=OPTIONS[:2], options=OPTIONS, title="Choose values:", description=tooltip)

show(multi_choice)
