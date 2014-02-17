import numpy as np
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import colorConverter
from bokeh import pyplot
from bokeh import plotting


def make_segments(x, y):
    '''
    Create list of line segments from x and y coordinates.
    '''

    points = np.array([x, y]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    return segments


def colorline(x, y, colors=None, linewidth=3, alpha=1.0):
    '''
    Plot a colored line with coordinates x and y
    Optionally specify a line width and alpha
    '''

    # Make a list of colors cycling through the rgbcmyk series.
    colors = [colorConverter.to_rgba(c) for c in ('r','g','b','c','y','m','k')]
    widths = [5, 10, 20, 40, 20, 10, 5]

    segments = make_segments(x, y)
    lc = LineCollection(segments, colors=colors, linewidth=widths, alpha=alpha)

    ax = plt.gca()
    ax.add_collection(lc)

    return lc

# Colores sine wave

x = np.linspace(0, 4 * np.pi, 100)
y = np.sin(x)

colorline(x, y)

plt.title("MPL support for ListCollection in Bokeh")
plt.xlim(x.min(), x.max())
plt.ylim(-1.0, 1.0)

pyplot.show_bokeh(plt.gcf(), filename="mpl_listcollection.html")

plotting.session().dumpjson(file="mpl_listcollection.json")
