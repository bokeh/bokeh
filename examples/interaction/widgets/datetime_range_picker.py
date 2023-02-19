from bokeh.io import show
from bokeh.models import CustomJS, DatetimeRangePicker

datetime_range_picker = DatetimeRangePicker(
    title="Select date and time range",
    value=("2019-09-20T12:37:51", "2019-10-15T17:59:18"),
    min_date="2019-08-01T09:00:00",
    max_date="2019-10-30T18:00:00",
    width=400,
)
datetime_range_picker.js_on_change("value", CustomJS(code="""
    console.log("datetime_range_picker: value=" + this.value, this.toString())
"""))

show(datetime_range_picker)
