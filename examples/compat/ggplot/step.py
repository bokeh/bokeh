from ggplot import *
from bokeh import mpl
from bokeh.plotting import show
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

show(mpl.to_bokeh(name="step"))
