from ggplot import aes, geom_line, ggplot, meat
import matplotlib.pyplot as plt

from bokeh import mpl
from bokeh.plotting import output_file, show

g = ggplot(aes(x='date', y='beef'), data=meat) + geom_line()
g.draw()

plt.title("Line ggplot-based plot in Bokeh.")

output_file("line.html")

show(mpl.to_bokeh())
