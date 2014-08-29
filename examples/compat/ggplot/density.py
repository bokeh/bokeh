from ggplot import *
from bokeh import mpl
import matplotlib.pyplot as plt

g = ggplot(diamonds, aes(x='price', color='cut')) + \
    geom_density()

g.draw()

plt.title("Density ggplot-based plot in Bokeh.")

mpl.to_bokeh(name="density")
