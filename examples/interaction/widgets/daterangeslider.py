from datetime import date

from bokeh.io import show
from bokeh.models import CustomJS, DateRangeSlider

date_range_slider = DateRangeSlider(value=(date(2016, 1, 1), date(2016, 12, 31)),
                                    start=date(2015, 1, 1), end=date(2017, 12, 31))
date_range_slider.js_on_change("value", CustomJS(code="""
    console.log('date_range_slider: value=' + this.value, this.toString())
"""))

show(date_range_slider)
