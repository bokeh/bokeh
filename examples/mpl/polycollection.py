import numpy as np
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from bokeh import pyplot

# Generate data. In this case, we'll make a bunch of center-points and generate
# verticies by subtracting random offsets from those center-points
numpoly, numverts = 100, 4
centers = 100 * (np.random.random((numpoly, 2)) - 0.5)
offsets = 10 * (np.random.random((numverts, numpoly, 2)) - 0.5)
verts = centers + offsets
verts = np.swapaxes(verts, 0, 1)

# In your case, "verts" might be something like:
# verts = zip(zip(lon1, lat1), zip(lon2, lat2), ...)
# If "data" in your case is a numpy array, there are cleaner ways to reorder
# things to suit.

facecolors = ['red', 'green', 'blue', 'cyan', 'yellow', 'magenta', 'black']

edgecolors = ['cyan', 'yellow', 'magenta', 'black', 'red', 'green', 'blue']

widths = [5, 10, 20, 10, 5]

ax = plt.axes()

# Make the collection and add it to the plot.
col = PolyCollection(verts, facecolor=facecolors, edgecolor=edgecolors,
                     linewidth=widths, linestyle='--', alpha=0.5)
ax.add_collection(col)

plt.xlim([-60, 60])
plt.ylim([-60, 60])

plt.title("MPL-PolyCollection support in Bokeh")

pyplot.show_bokeh(plt.gcf(), filename="polycollection.html")
