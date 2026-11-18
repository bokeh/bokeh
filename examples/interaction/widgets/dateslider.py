''' Select a date along a timeline with a slider.

.. bokeh-example-metadata::
    :title: Dateslider
    :keywords: date, slider
    :apis: bokeh.models.CustomJS, bokeh.models.DateSlider
'''

from datetime import date

from bokeh.io import show
from bokeh.models import CustomJS, DateSlider

date_slider = DateSlider(value=date(2016, 1, 1),
                         start=date(2015, 1, 1),
                         end=date(2017, 12, 31))
date_slider.js_on_change("value", CustomJS(code="""
    console.log('date_slider: value=' + this.value, this.toString())
"""))

show(date_slider)
