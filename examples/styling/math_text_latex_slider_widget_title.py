from bokeh.io import show
from bokeh.models import Slider

slider = Slider(start=0, end=10, value=1, step=.1, title=r"$$\delta \text{ (damping factor, 1/s)}$$")
show(slider)
