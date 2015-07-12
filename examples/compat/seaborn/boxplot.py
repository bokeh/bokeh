import seaborn as sns

from bokeh import mpl
from bokeh.plotting import output_file, show

sns.set(style="ticks")

# Load the example tips dataset
tips = sns.load_dataset("tips")

# Draw a nested boxplot to show bills by day and sex
sns.boxplot(x="day", y="total_bill", hue="sex", data=tips, palette="PRGn")
sns.despine(offset=10, trim=True)

output_file("boxplot.html")

show(mpl.to_bokeh())

