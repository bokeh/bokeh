
from bokeh.charts import BoxPlot, output_file, show
from bokeh.sampledata.autompg import autompg as df
from bokeh.charts import defaults, vplot, hplot

defaults.width = 450
defaults.height = 350

box_plot = BoxPlot(df, label='cyl', values='mpg', title="label='cyl', values='mpg'")

box_plot2 = BoxPlot(df, label=['cyl', 'origin'], values='mpg', title="label=['cyl', 'origin'], values='mpg'")

# bar_plot2 = BoxPlot(df, label='cyl', bar_width=0.4, title="label='cyl' bar_width=0.4")
#
# bar_plot3 = BoxPlot(df, label='cyl', values='mpg', agg='mean',
#                 title="label='cyl' values='mpg' agg='mean'")
#
# bar_plot4 = BoxPlot(df, label='cyl', title="label='cyl' color='DimGray'", color='dimgray')
#
# # multiple columns
# bar_plot5 = BoxPlot(df, label=['cyl', 'origin'], values='mpg', agg='mean',
#                 title="label=['cyl', 'origin'] values='mpg' agg='mean'")
#
# bar_plot6 = BoxPlot(df, label='origin', values='mpg', agg='mean', stack='cyl',
#                 title="label='origin' values='mpg' agg='mean' stack='cyl'", legend='top_right')
#
# bar_plot7 = BoxPlot(df, label='cyl', values='displ', agg='mean', group='origin',
#                 title="label='cyl' values='displ' agg='mean' group='origin'", legend='top_right')

# ToDo: negative values
# bar_plot8 = Bar(df, label='cyl', values='neg_displ', agg='mean', group='origin', color='origin',
#                 title="label='cyl' values='displ' agg='mean' group='origin'", legend='top_right')


# collect and display
output_file("boxplot.html")

show(
    vplot(
        hplot(box_plot, box_plot2)
    )
)
