from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = BoxPlot(df, values='mpg', label='cyl', whisker_color='cyl',
            title="MPG Summary (grouped and whiskers shaded by CYL)")

output_file("boxplot.html")

show(p)
