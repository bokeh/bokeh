from bokeh.io import show
from bokeh.models import CustomJS, RadioGroup

LABELS = ["Option 1", "Option 2", "Option 3"]

radio_group = RadioGroup(labels=LABELS, active=0)
radio_group.js_on_click(CustomJS(code="""
    console.log('radio_group: active=' + this.active, this.toString())
"""))

show(radio_group)
