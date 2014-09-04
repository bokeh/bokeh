from ggplot import *
from bokeh import mpl
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

mpl.to_bokeh(name="step")
