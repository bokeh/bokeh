# demo inspired by: http://matplotlib.org/examples/pylab_examples/subplot_demo.html

from bokeh import mpl
from bokeh.plotting import output_file, show

import matplotlib.pyplot as plt
import numpy as np

x1 = np.linspace(0.0, 5.0)
x2 = np.linspace(0.0, 2.0)

y1 = np.cos(2 * np.pi * x1) * np.exp(-x1)
y2 = np.cos(2 * np.pi * x2)

plt.subplot(2, 1, 1)
plt.plot(x1, y1, 'ko-')
plt.title('A tale of 2 subplots')
plt.ylabel('Damped oscillation')

plt.subplot(2, 1, 2)
plt.plot(x2, y2, 'r.-')
plt.xlabel('time (s)')
plt.ylabel('Undamped')

output_file("mpl_subplot.html", title="mpl_subplot.py example")

show(mpl.to_bokeh())
