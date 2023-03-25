from bokeh.io import show
from bokeh.models import CustomJS, MultipleDatetimePicker

multiple_datetime_picker = MultipleDatetimePicker(
    title="Select dates and times",
    value=[
        "2019-09-20T12:59:31",
        "2019-09-21T13:31:00",
        "2019-10-15T14:00:18",
    ],
    min_date="2019-08-01T09:00:00",
    max_date="2019-10-30T18:00:00",
    width=400,
)
multiple_datetime_picker.js_on_change("value", CustomJS(code="""
    console.log("multiple_datetime_picker: value=" + this.value, this.toString())
"""))

show(multiple_datetime_picker)
