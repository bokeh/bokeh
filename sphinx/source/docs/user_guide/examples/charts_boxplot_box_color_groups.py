from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = BoxPlot(df, values='mpg', label='cyl', color='cyl',
            title="MPG Summary (grouped and shaded by CYL)")

output_file("boxplot.html")

show(p)
