''' Display formatted HTML in a Bokeh layout.

.. bokeh-example-metadata::
    :title: Div
    :keywords: div, interaction, widgets
    :apis: bokeh.models.Div
'''

from bokeh.io import show
from bokeh.models import Div

div = Div(text="""Your <a href="https://en.wikipedia.org/wiki/HTML">HTML</a>-supported text is initialized with the <b>text</b> argument.  The
remaining div arguments are <b>width</b> and <b>height</b>. For this example, those values
are <i>200</i> and <i>100</i>, respectively.""",
width=200, height=100)

show(div)
