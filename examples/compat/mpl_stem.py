# demo inspired by: http://matplotlib.org/examples/pylab_examples/stem_plot.html

from bokeh import mpl
from bokeh.plotting import output_file, show

import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0.1, 2*np.pi, 10)
markerline, stemlines, baseline = plt.stem(x, np.cos(x), '-.')
plt.setp(markerline, 'markerfacecolor', 'b')
plt.setp(baseline, 'color', 'r', 'linewidth', 2)

output_file("mpl_stem.html", title="mpl_stem.py example")

show(mpl.to_bokeh(tools='pan, wheel_zoom, crosshair'))
