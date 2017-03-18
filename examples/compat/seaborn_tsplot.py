import seaborn as sns

from bokeh import mpl
from bokeh.plotting import output_file, show

sns.set(style="darkgrid")

# Load the long-form example gammas dataset
gammas = sns.load_dataset("gammas")

# Plot the response with standard error
sns.tsplot(data=gammas, time="timepoint", unit="subject",
           condition="ROI", value="BOLD signal")

output_file("seaborn_tsplot.html", title="seaborn_tsplot.py example")

show(mpl.to_bokeh())
