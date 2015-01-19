from ggplot import *
from bokeh import mpl
from bokeh.plotting import show
import matplotlib.pyplot as plt

g = ggplot(diamonds, aes(x='price', color='cut')) + \
    geom_density()

g.draw()

plt.title("Density ggplot-based plot in Bokeh.")

show(mpl.to_bokeh(name="density"))
