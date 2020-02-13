from bokeh.io import show
from bokeh.plotting import figure
from bokeh.util import structure

# draw the structure graph of a basic figure model
f=figure()
show(structure.draw_model(f))
