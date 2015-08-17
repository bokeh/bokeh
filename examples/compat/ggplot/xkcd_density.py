from ggplot import aes, diamonds, geom_density, ggplot
import matplotlib.pyplot as plt

from bokeh import mpl
from bokeh.plotting import output_file, show

g = ggplot(diamonds, aes(x='price', color='cut')) + geom_density()
g.draw()

plt.title("xkcd-ggplot-mpl based plot in Bokeh.")

output_file("xkcd_density.html")

show(mpl.to_bokeh(xkcd=True))
