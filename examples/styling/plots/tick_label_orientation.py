from math import pi

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis.major_label_orientation = pi/4
p.yaxis.major_label_orientation = "vertical"

show(p)
