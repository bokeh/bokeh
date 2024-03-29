from bokeh.models import Range1d
from bokeh.plotting import figure, show

# create a new plot with a range set with a tuple
p = figure(width=400, height=400, x_range=(0, 20))

# set a range using a Range1d
p.y_range = Range1d(0, 15)

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
