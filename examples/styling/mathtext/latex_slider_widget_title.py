''' This example demonstrates the use of mathtext on a ``Slider`` widget.

.. bokeh-example-metadata::
    :apis: bokeh.models.widgets.Slider
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex
'''
from bokeh.io import show
from bokeh.models import Slider

slider = Slider(start=0, end=10, value=1, step=.1, title=r"$$\delta \text{ (damping factor, 1/s)}$$")

show(slider)
