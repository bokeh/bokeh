from bokeh import pyplot
from pylab import *
from bokeh import plotting
x = linspace(-2*pi,2*pi,100)
y = sin(x)
plot(x,y,"r-x")

pyplot.show_bokeh(gcf(), filename="mpltest.html")

plotting.session().dumpjson(file="mpltest.json")