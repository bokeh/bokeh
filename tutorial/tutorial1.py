# For information about this tutorial, please consult the
# Tutorial section of the documentation (http://bokeh.pydata.org/tutorial.html).

from bokeh.plotting import *
from numpy import *
x = linspace(-2*pi, 2*pi, 100)
y = cos(x)
output_file("cos.html")
line(x, y, color="red")
scatter(x, y, marker="square", color="blue")
show()
