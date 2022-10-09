from bokeh.io import show
from bokeh.models import CustomJS, RadioButtonGroup

LABELS = ["Option 1", "Option 2", "Option 3"]

radio_button_group = RadioButtonGroup(labels=LABELS, active=0)
radio_button_group.js_on_event("button_click", CustomJS(args=dict(btn=radio_button_group), code="""
    console.log('radio_button_group: active=' + btn.active, this.toString())
"""))

show(radio_button_group)
