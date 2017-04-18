from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models.widgets import TextareaInput

output_file("textarea_input.html")

textarea_input = TextareaInput(value="default", title="Label:")

show(widgetbox(textarea_input))
