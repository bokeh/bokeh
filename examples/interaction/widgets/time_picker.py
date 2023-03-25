from bokeh.io import show
from bokeh.models import CustomJS, TimePicker

time_picker = TimePicker(title="Select time", value="12:59:31", min_time="09:00:00", max_time="18:00:00")
time_picker.js_on_change("value", CustomJS(code="""
    console.log("time_picker: value=" + this.value, this.toString())
"""))

show(time_picker)
