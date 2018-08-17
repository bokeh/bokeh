from bokeh.io import output_file, show
from bokeh.models.widgets import RangeSlider

output_file("range_slider.html")

range_slider = RangeSlider(start=0, end=10, value=(1,9), step=.1, title="Stuff")

show(range_slider)
