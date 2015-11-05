
from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df
from bokeh.charts import defaults, vplot, hplot

defaults.width = 450
defaults.height = 350

box_plot = BoxPlot(df, label='cyl', values='mpg',
                   title="label='cyl', values='mpg'")

box_plot2 = BoxPlot(df, label=['cyl', 'origin'], values='mpg',
                    title="label=['cyl', 'origin'], values='mpg'")

box_plot3 = BoxPlot(df, label='cyl', values='mpg', color='cyl',
                    title="label='cyl' values='mpg'")

# use constant fill color
box_plot4 = BoxPlot(df, label='cyl', values='displ',
                    title="label='cyl' color='blue'",
                    color='blue')

# color by one dimension and label by two dimensions
box_plot5 = BoxPlot(df, label=['cyl', 'origin'], values='mpg',
                    title="label=['cyl', 'origin'] color='cyl'",
                    color='cyl')

# specify custom marker for outliers
box_plot6 = BoxPlot(df, label='cyl', values='mpg', marker='cross',
                    title="label='cyl', values='mpg', marker='cross'")

# color whisker by cylinder
box_plot7 = BoxPlot(df, label='cyl', values='mpg', whisker_color='cyl',
                    title="label='cyl', values='mpg', whisker_color='cyl'")

# remove outliers
box_plot8 = BoxPlot(df, label='cyl', values='mpg', outliers=False,
                    title="label='cyl', values='mpg', outliers=False")

# collect and display
output_file("boxplot_multi.html")

show(
    vplot(
        hplot(box_plot, box_plot2, box_plot3),
        hplot(box_plot4, box_plot5, box_plot6),
        hplot(box_plot7, box_plot8)
    )
)
