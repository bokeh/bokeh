
from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df
from bokeh.charts import defaults, vplot, hplot

defaults.width = 450
defaults.height = 350

box_plot = BoxPlot(df, label='cyl', values='mpg', title="label='cyl', values='mpg'")

box_plot2 = BoxPlot(df, label=['cyl', 'origin'], values='mpg', title="label=['cyl', 'origin'], values='mpg'")

box_plot3 = BoxPlot(df, label='cyl', values='mpg', agg='mean',
                title="label='cyl' values='mpg' agg='mean'")

box_plot4 = BoxPlot(df, label='cyl', title="label='cyl' color='DimGray'", color='dimgray')

# collect and display
output_file("boxplot.html")

show(
    vplot(
        hplot(box_plot, box_plot2),
        hplot(box_plot3, box_plot4),
    )
)
