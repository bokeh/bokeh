from ggplot import aes, geom_point, ggplot, mtcars
import matplotlib.pyplot as plt

from pandas import DataFrame

from bokeh import mpl
from bokeh.plotting import output_file, show

g = ggplot(mtcars, aes(x='wt', y='mpg', color='qsec')) + geom_point()
g.make()

plt.title("Point ggplot-based plot in Bokeh.")

output_file("ggplot_point.html", title="ggplot_point.py example")

show(mpl.to_bokeh())
