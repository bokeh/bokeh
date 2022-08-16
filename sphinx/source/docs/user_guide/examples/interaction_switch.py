from bokeh.models import CustomJS, Switch
from bokeh.io import show

switch = Switch(active=True)
switch.js_on_change("active", CustomJS(code="""
    console.log('switch: active=' + this.active, this.toString())
"""))
show(switch)
