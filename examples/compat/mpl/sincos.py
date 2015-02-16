import numpy as np
import matplotlib.pyplot as plt
from bokeh import mpl
from bokeh.plotting import show

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)
z = np.cos(x)

plt.plot(x, y, "r-", marker='o')
plt.title("Matplotlib Figure in Bokeh")

# dashed lines work
plt.plot(x, z, "g-x", linestyle="-.")

#show(mpl.to_bokeh())
#show(mpl.to_bokeh(name="sincos"))
show(mpl.to_bokeh(plt.gcf(), name="sincos"))
#show(mpl.to_bokeh(plt.gcf(), server="default"))
#show(mpl.to_bokeh(plt.gcf(), name="sincos", server="default"))
