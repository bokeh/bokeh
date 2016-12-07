from bokeh.charts import Histogram, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Histogram(df, values='hp', color='navy', title="HP Distribution")

output_file("histogram_color.html")

show(p)
