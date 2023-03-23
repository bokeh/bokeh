''' A visualization of buttons in bokeh.models. This example demonstrates
changing the value of an object when a certain event (like clicking of a button)
happens.

.. bokeh-example-metadata::
    :apis: bokeh.io.show, bokeh.models.Button, Bokeh.models.SetValue
    :refs: :ref:`ug_interaction_js_callbacks_setvalue`
    :keywords: js callbacks
'''
from bokeh.io import show
from bokeh.models import Button, SetValue

button = Button(label="Foo", button_type="primary")
callback = SetValue(obj=button, attr="label", value="Bar")
button.js_on_event("button_click", callback)

show(button)
