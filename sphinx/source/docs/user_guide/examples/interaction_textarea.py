from bokeh.io import output_file, show
from bokeh.layouts import column
from bokeh.models import TextAreaInput

output_file("text_area_input.html")

text_area_input = TextAreaInput(value="default", title="Label:", rows=5, cols=50, max_length=200)

show(column(text_area_input))
