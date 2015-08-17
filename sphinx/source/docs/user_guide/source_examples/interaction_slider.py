from bokeh.models.widgets import Slider
from bokeh.io import output_file, show, vform

output_file("slider.html")

slider = Slider(start=0, end=10, value=1, step=.1, title="Stuff")

show(vform(slider))
