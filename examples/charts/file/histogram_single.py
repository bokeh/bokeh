from bokeh.charts import Histogram, output_file, show
from bokeh.sampledata.autompg import autompg as df

df.sort_values(by='cyl', inplace=True)

hist = Histogram(df, values='hp', color='cyl',
                 title="HP Distribution by Cylinder Count", legend='top_right')

output_file("histogram_single.html", title="histogram_single.py example")

show(hist)
