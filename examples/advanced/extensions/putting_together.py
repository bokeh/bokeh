''' Connect a Python slider model to a custom TypeScript widget that displays its
value.

.. bokeh-example-metadata::
    :title: Custom widget from a Python model
    :keywords: custom model, widget, Python, TypeScript
    :apis: bokeh.models.Slider, bokeh.models.UIElement
'''

from bokeh.core.properties import Instance, Required, String
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Slider, UIElement


class Custom(UIElement):

    __implementation__ = "custom.ts"

    text = String(default="Custom text")

    slider = Required(Instance(Slider))

slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

custom = Custom(text="Special Slider Display", slider=slider)

layout = column(slider, custom)

show(layout)
