from bokeh.io import output_file, show
from bokeh.models.widgets import Slider

output_file("slider.html")

slider = Slider(start=0, end=10, value=1, step=.1, title="Stuff")

show(slider)
