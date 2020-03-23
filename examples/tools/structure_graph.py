from bokeh.io import show
from bokeh.plotting import figure
from bokeh.util import structure
from bokeh.layouts import column

# draw the structure graph of a basic figure model
f = figure(width=400,height=400)
f.line(x=[1,2,3],y=[1,2,3])
K = structure.BokehStructureGraph(f)
show(column(f,K.model))
