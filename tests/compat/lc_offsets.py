from matplotlib.collections import LineCollection
import matplotlib.pyplot as plt
import numpy as np

from bokeh import mpl
from bokeh.plotting import output_file, show

# Simulate a series of ocean current profiles, successively
# offset by 0.1 m/s so that they form what is sometimes called
# a "waterfall" plot or a "stagger" plot.

nverts = 60
ncurves = 20
offs = (0.1, 0.0)

rs = np.random.RandomState([12345678])
yy = np.linspace(0, 2 * np.pi, nverts)
ym = np.amax(yy)
xx = (0.2 + (ym - yy) / ym) ** 2 * np.cos(yy - 0.4) * 0.5
segs = []
for i in range(ncurves):
    xxx = xx + 0.02 * rs.randn(nverts)
    curve = list(zip(xxx, yy * 100))
    segs.append(curve)

colors = [(1.0, 0.0, 0.0, 1.0), (0.0, 0.5, 0.0, 1.0), (0.0, 0.0, 1.0, 1.0),
          (0.0, 0.75, 0.75, 1.0), (0.75, 0.75, 0, 1.0), (0.75, 0, 0.75, 1.0),
          (0.0, 0.0, 0.0, 1.0)]

col = LineCollection(segs, linewidth=5, offsets=offs)

ax = plt.axes()
ax.add_collection(col, autolim=True)
col.set_color(colors)
ax.set_title('Successive data offsets')

fig = plt.gcf()

output_file("lc_offsets.html", title="lc_offsets.py example")

show(mpl.to_bokeh())
