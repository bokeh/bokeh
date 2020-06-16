from bokeh.io import show
from bokeh.layouts import column
from bokeh.plotting import figure
from bokeh.util.structure import generate_structure_plot

# draw the structure graph of a basic figure model
f = figure(width=400,height=400)
f.line(x=[1,2,3],y=[1,2,3])
K = generate_structure_plot(f)
show(column(f,K))
