from datetime import datetime

from bokeh.io import show
from bokeh.models import CustomJS, DatetimeSlider

datetime_slider = DatetimeSlider(value=datetime(2022, 3, 25, 12, 34, 56),
                                 start=datetime(2022, 1, 1, 0, 0, 0),
                                 end=datetime(2022, 12, 31, 23, 59, 59))
datetime_slider.js_on_change("value", CustomJS(code="""
    console.log('datetime_slider: value=' + this.value, this.toString())
"""))

show(datetime_slider)

