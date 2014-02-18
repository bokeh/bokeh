import numpy as np
import matplotlib.pyplot as plt
from bokeh import pyplot
from bokeh import plotting

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)


plt.plot(x, y, "r-")
plt.title("Matplotlib Figure in Bokeh")

# dashed lines work
#plt.plot(x,y,"r-x", linestyle="-.")

pyplot.show_bokeh(plt.gcf(), filename="mpltest.html")

plotting.session().dumpjson(file="mpltest.json")