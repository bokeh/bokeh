from math import pi

from bokeh.plotting import figure, show, value

p = figure(width=400, height=400)
p.rect(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=value(40, units="screen"),
       color="#CAB2D6", angle=pi/3)

show(p)
