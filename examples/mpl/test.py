import numpy as np
import matplotlib.pyplot as plt
from bokeh import pyplot

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)

plt.plot(x, y, "r-")
plt.title("Matplotlib Figure in Bokeh")

# dashed lines work
#plt.plot(x,y,"r-x", linestyle="-.")

pyplot.show_bokeh(plt.gcf(), filename="test.html")
