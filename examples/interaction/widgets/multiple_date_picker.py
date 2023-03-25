from bokeh.io import show
from bokeh.models import CustomJS, MultipleDatePicker

multiple_date_picker = MultipleDatePicker(
    title="Select dates",
    value=["2019-09-20", "2019-09-21", "2019-10-15"],
    min_date="2019-08-01",
    max_date="2019-10-30",
    width=400,
)
multiple_date_picker.js_on_change("value", CustomJS(code="""
    console.log("multiple_date_picker: value=" + this.value, this.toString())
"""))

show(multiple_date_picker)
