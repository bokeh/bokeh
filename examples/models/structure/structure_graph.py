from bokeh.io import show
from bokeh.layouts import column
from bokeh.models.util import generate_structure_plot
from bokeh.plotting import figure

# draw the structure graph of a basic figure model
f = figure(width=400,height=400)
f.line(x=[1,2,3],y=[1,2,3])
K = generate_structure_plot(f)
show(column(f,K))
