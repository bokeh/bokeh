from bokeh.models.widgets import TextInput
from bokeh.io import output_file, show, vform

output_file("text_input.html")

text_input = TextInput(value="default", title="Label:")

show(vform(text_input))
