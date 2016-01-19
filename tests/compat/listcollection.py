from matplotlib.collections import LineCollection
import matplotlib.pyplot as plt
import numpy as np

from bokeh import mpl
from bokeh.plotting import output_file, show


def make_segments(x, y):
    '''
    Create list of line segments from x and y coordinates.
    '''

    points = np.array([x, y]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    return segments


def colorline(x, y, colors=None, linewidth=3, alpha=1.0):
    '''
    Plot a line with segments.
    Optionally, specify segments colors and segments widths.
    '''

    # Make a list of colors cycling through the rgbcmyk series.
    # You have several ways to input the colors:
    # colors = ['r','g','b','c','y','m','k']
    # colors = ['red','green','blue','cyan','yellow','magenta','black']
    # colors = ['#ff0000', '#008000', '#0000ff', '#00bfbf', '#bfbf00', '#bf00bf', '#000000']
    # colors = [(1.0, 0.0, 0.0, 1.0), (0.0, 0.5, 0.0, 1.0), (0.0, 0.0, 1.0, 1.0), (0.0, 0.75, 0.75, 1.0),
    #           (0.75, 0.75, 0, 1.0), (0.75, 0, 0.75, 1.0), (0.0, 0.0, 0.0, 1.0)]

    colors = ['r', 'g', 'b', 'c', 'y', 'm', 'k']
    widths = [5, 10, 20, 40, 20, 10, 5]

    segments = make_segments(x, y)
    lc = LineCollection(segments, colors=colors, linewidth=widths, alpha=alpha)

    ax = plt.gca()
    ax.add_collection(lc)

    return lc

# Colored sine wave

x = np.linspace(0, 4 * np.pi, 100)
y = np.sin(x)

colorline(x, y)

plt.title("MPL support for ListCollection in Bokeh")
plt.xlim(x.min(), x.max())
plt.ylim(-1.0, 1.0)

output_file("listcollection.html", title="listcollection.py example")

show(mpl.to_bokeh())
