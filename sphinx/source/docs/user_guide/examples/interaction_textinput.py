from bokeh.io import output_file, show
from bokeh.models.widgets import TextInput

output_file("text_input.html")

text_input = TextInput(value="default", title="Label:")

show(text_input)
