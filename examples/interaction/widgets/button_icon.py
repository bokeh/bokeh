''' Put an icon beside a button's label.

.. bokeh-example-metadata::
    :title: Button with an icon
    :keywords: button, icon
    :apis: bokeh.models.BuiltinIcon, bokeh.models.Button, bokeh.models.SetValue
    :gallery: A blue button with a settings icon beside its label.
'''

from bokeh.io import show
from bokeh.models import BuiltinIcon, Button, SetValue

icon = BuiltinIcon("settings", size="1.2em", color="white")
button = Button(label="Foo", icon=icon, button_type="primary")
button.js_on_event("button_click", SetValue(button, "label", "Bar"))

show(button)
