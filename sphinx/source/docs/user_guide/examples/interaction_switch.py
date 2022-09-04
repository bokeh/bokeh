from bokeh.io import show
from bokeh.models import CustomJS, Switch

switch = Switch(active=True)
switch.js_on_change("active", CustomJS(code="""
    console.log('switch: active=' + this.active, this.toString())
"""))
show(switch)
