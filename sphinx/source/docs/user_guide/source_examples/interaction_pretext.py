from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models.widgets import PreText

output_file("div.html")

pre = PreText(text="""Your text is initialized with the 'text' argument.

The remaining Paragraph arguments are 'width' and 'height'. For this example,
those values are 500 and 100 respectively.""",
width=500, height=100)

show(widgetbox(pre))
