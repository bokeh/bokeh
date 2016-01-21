from matplotlib.collections import LineCollection
import matplotlib.pyplot as plt
import numpy as np

from bokeh import mpl
from bokeh.plotting import output_file, show

# In order to efficiently plot many lines in a single set of axes,
# add the lines all at once. Here is a simple example showing how it is done.

N = 50
x = np.arange(N)

# Here are many sets of y to plot vs x
ys = [x + i for i in x]

colors = ['#ff0000', '#008000', '#0000ff', '#00bfbf', '#bfbf00', '#bf00bf', '#000000']

line_segments = LineCollection([list(zip(x, y)) for y in ys],
                               color=colors,
                               linewidth=(0.5, 1, 1.5, 2),
                               linestyle='dashed')

ax = plt.axes()
ax.add_collection(line_segments)
ax.set_title('Line Collection with dashed colors')

output_file("lc_dashed.html", title="lc_dashed.py example")

show(mpl.to_bokeh())
