from ggplot import aes, geom_step, ggplot
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from bokeh import mpl
from bokeh.plotting import output_file, show

df = pd.DataFrame({
    "x": range(100),
    "y": np.random.choice([-1, 1], 100)
})
df.y = df.y.cumsum()

g = ggplot(aes(x='x', y='y'), data=df) + geom_step()
g.draw()

plt.title("Step ggplot-based plot in Bokeh.")

output_file("step.html", title="step.py example")

show(mpl.to_bokeh())
