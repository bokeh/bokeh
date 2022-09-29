from bokeh.io import show
from bokeh.models import Button, SetValue

button = Button(label="Foo", button_type="primary")
callback = SetValue(obj=button, attr="label", value="Bar")
button.js_on_event("button_click", callback)

show(button)
