import numpy as np
import matplotlib.pyplot as plt
from bokeh import mpl_renderer

x = np.linspace(-2 * np.pi, 2 * np.pi, 100)
y = np.sin(x)
z = np.sin(2 * x)

plt.plot(x, y, "r-")
plt.plot(x, z, "g-", linewidth=5, alpha=0.5)

mpl_renderer.to_bokeh(plt.gcf(), filename="mpl_test.html")
