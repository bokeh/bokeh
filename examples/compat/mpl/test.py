import numpy as np
import matplotlib.pyplot as plt
from bokeh import mpl

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)
z = np.cos(x)

plt.plot(x, y, "r-", marker='o')
plt.title("Matplotlib Figure in Bokeh")

# dashed lines work
plt.plot(x, z, "g-x", linestyle="-.")

#mpl.show(mpl.to_bokeh())
#mpl.show(mpl.to_bokeh(name="test"))
mpl.show(mpl.to_bokeh(plt.gcf(), name="test"))
#mpl.show(mpl.to_bokeh(plt.gcf(), server="default"))
#mpl.show(mpl.to_bokeh(plt.gcf(), name="test", server="default"))
