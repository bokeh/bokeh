from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df

# origin = the source of the data that makes up the autompg dataset
title = "MPG by Cylinders and Data Source, Colored by Cylinders"

# color by one dimension and label by two dimensions
# coloring by one of the columns visually groups them together
box_plot = BoxPlot(df, label=['cyl', 'origin'], values='mpg',
                   color='cyl', title=title)

output_file("boxplot_single.html", title="boxplot_single.py example")

show(box_plot)
