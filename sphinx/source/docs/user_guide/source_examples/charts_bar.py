from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Bar(df, 'cyl', values='mpg', title="Total MPG by CYL")

output_file("bar.html")

show(p)
