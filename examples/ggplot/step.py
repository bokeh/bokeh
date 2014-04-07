from ggplot import *
from bokeh import pyplot
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({
    "x": range(100),
    "y": np.random.choice([-1, 1], 100)
})

df.y = df.y.cumsum()

g = ggplot(aes(x='x', y='y'), data=df) + \
    geom_step()
g.draw()

plt.title("Step ggplot-based plot in Bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="step.html")
