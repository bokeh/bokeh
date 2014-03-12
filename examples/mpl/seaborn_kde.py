import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib as mpl
import matplotlib.pyplot as plt
from bokeh import pyplot
from bokeh import plotting

# Generate the pandas dataframe
data = np.random.multivariate_normal([0, 0], [[1, 2], [2, 20]], size=100)
data = pd.DataFrame(data, columns=["X", "Y"])
mpl.rc("figure", figsize=(6, 6))

# Just plot seaborn kde
sns.kdeplot(data, cmap="BuGn_d")

plt.title("Seaborn kdeplot in bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="seaborn_kde.html")

plotting.session().dumpjson(file="seaborn_kde.json")
