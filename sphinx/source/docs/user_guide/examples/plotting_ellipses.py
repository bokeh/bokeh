from math import pi
from bokeh.plotting import figure, show, output_file

output_file('ellipses.html')

p = figure(width=400, height=400)
p.ellipse(x=[1, 2, 3], y=[1, 2, 3], width=[0.2, 0.3, 0.1], height=0.3,
          angle=pi/3, color="#CAB2D6")

show(p)
