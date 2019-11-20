from math import pi

from bokeh.plotting import figure, output_file, show

output_file('rectangles_rotated.html')

p = figure(plot_width=400, plot_height=400)
p.rect(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=40, color="#CAB2D6",
       angle=pi/3, height_units="screen")

show(p)
