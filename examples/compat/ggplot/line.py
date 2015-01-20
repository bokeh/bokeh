from ggplot import *
from bokeh import mpl
from bokeh.plotting import show
import matplotlib.pyplot as plt

g = ggplot(aes(x='date', y='beef'), data=meat) + \
    geom_line()

g.draw()

plt.title("Line ggplot-based plot in Bokeh.")

show(mpl.to_bokeh(name="line"))
