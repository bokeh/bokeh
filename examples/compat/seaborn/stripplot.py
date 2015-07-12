import pandas as pd
import seaborn as sns

from bokeh import mpl
from bokeh.plotting import output_file, show

sns.set(style="whitegrid", palette="pastel")

# Load the example iris dataset
iris = sns.load_dataset("iris")

# "Melt" the dataset to "long-form" or "tidy" representation
iris = pd.melt(iris, "species", var_name="measurement")

# Draw a categorical scatterplot to show each observation
sns.stripplot(x="measurement", y="value", hue="species", data=iris,
              jitter=True, edgecolor="gray")

output_file("stripplot.html")

show(mpl.to_bokeh())

