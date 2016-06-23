from ggplot import aes, diamonds, geom_density, ggplot
import matplotlib.pyplot as plt

from bokeh import mpl
from bokeh.plotting import output_file, show

g = ggplot(diamonds, aes(x='price', color='cut')) + geom_density()
g.make()

plt.title("Density ggplot-based plot in Bokeh.")

output_file("ggplot_density.html", title="ggplot_density.py example")

show(mpl.to_bokeh())
