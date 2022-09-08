from bokeh.io import show
from bokeh.models import CustomJS, DatePicker

date_picker = DatePicker(title='Select date', value="2019-09-20", min_date="2019-08-01", max_date="2019-10-30")
date_picker.js_on_change("value", CustomJS(code="""
    console.log('date_picker: value=' + this.value, this.toString())
"""))

show(date_picker)
