''' Display a styled button with a text label.

.. bokeh-example-metadata::
    :title: Styled button
    :keywords: button
    :apis: bokeh.models.Button, bokeh.models.CustomJS
    :gallery: A green button labeled Foo.
'''

from bokeh.io import show
from bokeh.models import Button, CustomJS

button = Button(label="Foo", button_type="success")
button.js_on_event("button_click", CustomJS(code="console.log('button: click!', this.toString())"))

show(button)
