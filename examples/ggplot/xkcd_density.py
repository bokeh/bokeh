from ggplot import *
from bokeh import pyplot
import matplotlib.pyplot as plt

g = ggplot(diamonds, aes(x='price', color='cut')) + \
    geom_density()

g.draw()

plt.title("xkcd-ggplot-mpl based plot in Bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="density.html", xkcd=True)
