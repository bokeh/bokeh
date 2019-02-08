from bokeh.layouts import column
from bokeh.models import Slider
from bokeh.plotting import figure, show

plot = figure(plot_width=400, plot_height=400)
r = plot.circle([1,2,3,4,5,], [3,2,5,6,4], radius=0.2, alpha=0.5)

slider = Slider(start=0.1, end=2, step=0.01, value=0.2)
slider.js_link('value', r.glyph, 'radius')

show(column(plot, slider))
