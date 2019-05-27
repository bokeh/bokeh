from bokeh.io import output_file, show
from bokeh.models.widgets import TextAreaInput

output_file("text_input.html")

text_input = TextAreaInput(value="default", rows=6, title="Label:")

show(text_input)
