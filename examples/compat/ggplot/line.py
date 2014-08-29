from ggplot import *
from bokeh import mpl
import matplotlib.pyplot as plt

g = ggplot(aes(x='date', y='beef'), data=meat) + \
    geom_line()

g.draw()

plt.title("Line ggplot-based plot in Bokeh.")

mpl.to_bokeh(name="line")
