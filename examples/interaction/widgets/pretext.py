''' Display text while preserving whitespace and line breaks.

.. bokeh-example-metadata::
    :title: Preformatted text
    :keywords: pretext
    :apis: bokeh.models.PreText
    :gallery: Monospaced text preserving a blank line and explicit line breaks.
'''

from bokeh.io import show
from bokeh.models import PreText

pre = PreText(text="""Your text is initialized with the 'text' argument.

The remaining Paragraph arguments are 'width' and 'height'. For this example,
those values are 500 and 100, respectively.""",
width=500, height=100)

show(pre)
