''' Choose a numeric interval using two slider handles.

.. bokeh-example-metadata::
    :title: Range slider
    :keywords: range slider, interaction, widgets
    :apis: bokeh.models.CustomJS, bokeh.models.RangeSlider
'''

from bokeh.io import show
from bokeh.models import CustomJS, RangeSlider

range_slider = RangeSlider(start=0, end=10, value=(1,9), step=.1, title="Stuff")
range_slider.js_on_change("value", CustomJS(code="""
    console.log('range_slider: value=' + this.value, this.toString())
"""))

show(range_slider)
