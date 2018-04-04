from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure

plot = figure(toolbar_location=None)

l1 = plot.line([1, 2, 3], [1, 2, 3])
l2 = plot.line([1, 2, 3], [2, 4, 6])

plot.xaxis.visible = False
plot.ygrid.visible = False
l1.visible = False
l2.visible = True

save(plot)
