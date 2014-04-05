from ggplot import *
from bokeh import pyplot
from bokeh import plotting

g = ggplot(diamonds, aes(x='price', color='cut')) + \
    geom_density()

g.draw()

plt.title("Density ggplot-based plot in Bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="ggplot_density.html")

plotting.session().dumpjson(file="ggplot_density.json")
