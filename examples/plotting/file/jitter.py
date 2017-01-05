import numpy as np

from bokeh.models import Jitter
from bokeh.plotting import figure, show, output_file

p = figure(plot_width=500, plot_height=400, x_range=(0,3), y_range=(0,10),
           title="Demonstration of Jitter transform")

y1 = np.random.random(2500) * 10
y2 = np.random.normal(size=2500)*2 + 5

p.circle(x={'value': 1, 'transform': Jitter(width=0.4)}, y=y1,
         color="navy", alpha=0.3)

p.circle(x={'value': 2, 'transform': Jitter(width=0.4)}, y=y2,
         color="firebrick", alpha=0.3)

output_file("jitter.html")

show(p)
