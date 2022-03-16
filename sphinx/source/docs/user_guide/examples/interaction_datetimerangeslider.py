from datetime import datetime

from bokeh.io import show
from bokeh.models import CustomJS, DatetimeRangeSlider

datetime_range_slider = DatetimeRangeSlider(value=(datetime(2022, 3, 8, 12), datetime(2022, 3, 25, 18)),
                                            start=datetime(2022, 3, 1), end=datetime(2022, 3, 31))
datetime_range_slider.js_on_change("value", CustomJS(code="""
    console.log('datetime_range_slider: value=' + this.value, this.toString())
"""))

show(datetime_range_slider)
