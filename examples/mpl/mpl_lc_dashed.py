import numpy as np
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from bokeh import pyplot
from bokeh import plotting

# In order to efficiently plot many lines in a single set of axes,
# add the lines all at once. Here is a simple example showing how it is done.

N = 50
x = np.arange(N)
# Here are many sets of y to plot vs x
ys = [x+i for i in x]

# We need to set the plot limits, they will not autoscale
ax = plt.axes()
ax.set_xlim((np.amin(x),np.amax(x)))
ax.set_ylim((np.amin(np.amin(ys)),np.amax(np.amax(ys))))

colors = ['#ff0000', '#008000', '#0000ff', '#00bfbf', '#bfbf00', '#bf00bf', '#000000']

line_segments = LineCollection([list(zip(x,y)) for y in ys], color=colors,
                                linewidth=(0.5,1,1.5,2), linestyle='dashed')

ax.add_collection(line_segments)
ax.set_title('Line Collection with dashed colors')

pyplot.show_bokeh(plt.gcf(), filename="mpl_lc_dashed.html")

plotting.session().dumpjson(file="mpl_lc_dashed.json")
