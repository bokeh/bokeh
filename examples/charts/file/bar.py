from bokeh.charts import Bar, output_file, show, vplot, hplot, defaults
from bokeh.sampledata.autompg import autompg as df

df['neg_displ'] = 0 - df['displ']

defaults.width = 350
defaults.height = 250

bar_plot = Bar(df, label='cyl', title="label='cyl'")

bar_plot2 = Bar(df, label='cyl', bar_width=0.4, title="label='cyl' bar_width=0.4")

bar_plot3 = Bar(df, label='cyl', values='mpg', agg='mean',
                title="label='cyl' values='mpg' agg='mean'")

bar_plot4 = Bar(df, label='cyl', title="label='cyl' color='DimGray'", color='dimgray')

# multiple columns
bar_plot5 = Bar(df, label=['cyl', 'origin'], values='mpg', agg='mean',
                title="label=['cyl', 'origin'] values='mpg' agg='mean'")

bar_plot6 = Bar(df, label='origin', values='mpg', agg='mean', stack='cyl',
                title="label='origin' values='mpg' agg='mean' stack='cyl'", legend='top_right')

bar_plot7 = Bar(df, label='cyl', values='displ', agg='mean', group='origin',
                title="label='cyl' values='displ' agg='mean' group='origin'", legend='top_right')

# ToDo: negative values
# bar_plot8 = Bar(df, label='cyl', values='neg_displ', agg='mean', group='origin', color='origin',
#                 title="label='cyl' values='displ' agg='mean' group='origin'", legend='top_right')


# collect and display
output_file("bar.html")

show(
    vplot(
        hplot(bar_plot, bar_plot2, bar_plot3),
        hplot(bar_plot4, bar_plot5, bar_plot6),
        hplot(bar_plot7)
    )
)
