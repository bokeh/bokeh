from bokeh.io import show
from bokeh.models import CustomJS, Toggle

toggle = Toggle(label="Foo", button_type="success")
toggle.js_on_click(CustomJS(code="""
    console.log('toggle: active=' + this.active, this.toString())
"""))

show(toggle)
