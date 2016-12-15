from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = BoxPlot(df, values='mpg', label='cyl', whisker_color='goldenrod',
            title="MPG Summary (grouped by CYL, shaded whiskers)")

output_file("boxplot.html")

show(p)
