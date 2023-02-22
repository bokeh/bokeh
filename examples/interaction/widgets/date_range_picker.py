from bokeh.io import show
from bokeh.models import CustomJS, DateRangePicker

date_range_picker = DateRangePicker(
    title="Select date range",
    value=("2019-09-20", "2019-10-15"),
    min_date="2019-08-01",
    max_date="2019-10-30",
    width=400,
)
date_range_picker.js_on_change("value", CustomJS(code="""
    console.log("date_range_picker: value=" + this.value, this.toString())
"""))

show(date_range_picker)
