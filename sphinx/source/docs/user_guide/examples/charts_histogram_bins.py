from bokeh.charts import Histogram, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Histogram(df, values='mpg', bins=50,
              title="MPG Distribution (50 bins)")

output_file("histogram_bins.html")

show(p)
