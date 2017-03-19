from math import pi
from bokeh.plotting import figure, show, output_file

output_file('ovals.html')

p = figure(plot_width=400, plot_height=400)
p.oval(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=40, color="#CAB2D6",
       angle=pi/3, height_units="screen")

show(p)
