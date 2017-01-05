from bokeh.charts import Histogram, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Histogram(df, 'hp', title="HP Distribution")

output_file("histogram.html",)

show(p)
