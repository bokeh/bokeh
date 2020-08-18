from bokeh.io import show
from bokeh.models import Button, CustomJS

button = Button(label="Foo", button_type="success")
button.js_on_click(CustomJS(code="console.log('button: click!', this.toString())"))

show(button)
