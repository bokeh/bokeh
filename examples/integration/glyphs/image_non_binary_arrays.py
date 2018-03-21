from __future__ import absolute_import

import numpy as np

from bokeh.io import save
from bokeh.plotting import figure

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d1 = (np.sin(xx)*np.cos(yy)*100).astype('int64')
d2 = [[0, 1, 2, 3], [4, 5, 6, 7]]

p = figure(x_range=(0, 10), y_range=(0, 10))

p.image(image=[d1, d2], x=[0, 5], y=[0, 5], dw=5, dh=5, palette="Spectral11")

save(p)
