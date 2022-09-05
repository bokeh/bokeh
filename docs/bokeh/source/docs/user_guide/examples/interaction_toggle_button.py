from bokeh.io import show
from bokeh.models import CustomJS, Toggle

toggle = Toggle(label="Foo", button_type="success")
toggle.js_on_event('button_click', CustomJS(args=dict(btn=toggle), code="""
    console.log('toggle: active=' + btn.active, this.toString())
"""))

show(toggle)
