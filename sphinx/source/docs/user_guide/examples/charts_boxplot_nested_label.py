from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = BoxPlot(df, values='mpg', label=['cyl', 'origin'],
            title="MPG Summary (grouped by CYL, ORIGIN)")

output_file("boxplot.html")

show(p)
