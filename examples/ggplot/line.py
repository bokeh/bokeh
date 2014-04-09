from ggplot import *
from bokeh import pyplot
import matplotlib.pyplot as plt

g = ggplot(aes(x='date', y='beef'), data=meat) + \
    geom_line()

g.draw()

plt.title("Line ggplot-based plot in Bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="line.html")
