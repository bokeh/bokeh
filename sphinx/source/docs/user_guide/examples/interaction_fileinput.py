from bokeh.io import output_file, show
from bokeh.models import FileInput

output_file("file_input.html")

file_input = FileInput()

show(file_input)
