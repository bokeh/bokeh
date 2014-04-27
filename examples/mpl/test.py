import numpy as np
import matplotlib.pyplot as plt
from bokeh import pyplot

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)
z = np.cos(x)

plt.plot(x, y, "r-", marker='o')
#plt.title("Matplotlib Figure in Bokeh")

# dashed lines work
plt.plot(x, z, "g-x", linestyle="-.")

#pyplot.show_bokeh()
#pyplot.show_bokeh(name="test")
pyplot.show_bokeh(plt.gcf(), name="test")
#pyplot.show_bokeh(plt.gcf(), server="default")
#pyplot.show_bokeh(plt.gcf(), name="test", server="default")
