import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from bokeh import mpl
from bokeh.plotting import show

# generate some random data
data = 1 + np.random.randn(20, 6)

# Use Seaborn and Matplotlib normally
sns.violinplot(data, color="Set3")
plt.title("Seaborn violin plot in Bokeh")

# Convert to interactive Bokeh plot with one command
show(mpl.to_bokeh(name="violin"))
