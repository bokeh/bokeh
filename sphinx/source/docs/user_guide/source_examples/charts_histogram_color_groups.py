from bokeh.charts import Histogram, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Histogram(df, values='hp', color='cyl',
              title="HP Distribution (color grouped by CYL)",
              legend='top_right')

output_file("histogram_color.html")

show(p)
