from bokeh.io import show
from bokeh.models import CustomJS, DatetimePicker

datetime_picker = DatetimePicker(
    title="Select date and time",
    value="2019-09-20T12:37:51",
    min_date="2019-08-01T09:00:00",
    max_date="2019-10-30T18:00:00",
)
datetime_picker.js_on_change("value", CustomJS(code="""
    console.log("datetime_picker: value=" + this.value, this.toString())
"""))

show(datetime_picker)
