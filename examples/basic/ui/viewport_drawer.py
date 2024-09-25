import numpy as np

from bokeh.models import Drawer, Examiner
from bokeh.palettes import Spectral11
from bokeh.plotting import figure, show

N = 1000
x = np.random.random(size=N)*100
y = np.random.random(size=N)*100
radii = np.random.random(size=N)*1.5
colors = np.random.choice(Spectral11, size=N)

plot = figure()
plot.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

examiner = Examiner(target=plot)
drawer = Drawer(location="right", resizable=True, elements=[examiner])

show([plot, drawer])
