import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from bokeh import pyplot
from bokeh import plotting

# We generated random data
data = 1 + np.random.randn(20, 6)

# And then just call the violinplot from Seaborn
sns.violinplot(data, color="Set3")

plt.title("Seaborn violin plot in bokeh.")

pyplot.show_bokeh(plt.gcf(), filename="seaborn_violet.html")

plotting.session().dumpjson(file="seaborn_violet.json")
