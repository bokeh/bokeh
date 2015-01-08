import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib as mplc
import matplotlib.pyplot as plt
from bokeh import mpl
from bokeh.plotting import show

# Generate the pandas dataframe
data = np.random.multivariate_normal([0, 0], [[1, 2], [2, 20]], size=100)
data = pd.DataFrame(data, columns=["X", "Y"])
mplc.rc("figure", figsize=(6, 6))

# Just plot seaborn kde
sns.kdeplot(data, cmap="BuGn_d")

plt.title("Seaborn kdeplot in bokeh.")

show(mpl.to_bokeh(name="kde"))
