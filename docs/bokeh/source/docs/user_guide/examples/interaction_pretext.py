from bokeh.io import show
from bokeh.models import PreText

pre = PreText(text="""Your text is initialized with the 'text' argument.

The remaining Paragraph arguments are 'width' and 'height'. For this example,
those values are 500 and 100, respectively.""",
width=500, height=100)

show(pre)
