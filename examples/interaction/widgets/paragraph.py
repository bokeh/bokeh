from bokeh.io import show
from bokeh.models import Paragraph

p = Paragraph(text="""Your text is initialized with the 'text' argument.  The
remaining Paragraph arguments are 'width' and 'height'. For this example, those values
are 200 and 100, respectively.""",
width=200, height=100)

show(p)
