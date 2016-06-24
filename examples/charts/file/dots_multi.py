from bokeh.charts import Dot, output_file, show, defaults
from bokeh.layouts import gridplot
from bokeh.sampledata.autompg import autompg as df

df['neg_mpg'] = 0 - df['mpg']

defaults.plot_width = 450
defaults.plot_height = 350

dot_plot = Dot(df, label='cyl', title="label='cyl'")

dot_plot2 = Dot(df, label='cyl', title="label='cyl' dot_width=0.4")

dot_plot3 = Dot(df, label='cyl', values='mpg', agg='mean', stem=True,
                title="label='cyl' values='mpg' agg='mean'")

dot_plot4 = Dot(df, label='cyl', title="label='cyl' color='DimGray'", color='dimgray')

# multiple columns
dot_plot5 = Dot(df, label=['cyl', 'origin'], values='mpg', agg='mean',
                title="label=['cyl', 'origin'] values='mpg' agg='mean'")

dot_plot6 = Dot(df, label='origin', values='mpg', agg='mean', stack='cyl',
                title="label='origin' values='mpg' agg='mean' stack='cyl'",
                legend='top_right')

dot_plot7 = Dot(df, label='cyl', values='displ', agg='mean', group='origin',
                title="label='cyl' values='displ' agg='mean' group='origin'",
                legend='top_right')

dot_plot8 = Dot(df, label='cyl', values='neg_mpg', agg='mean', group='origin',
                color='origin', legend='top_right',
                title="label='cyl' values='neg_mpg' agg='mean' group='origin'")

# infer labels from index
df = df.set_index('cyl')
dot_plot9 = Dot(df, values='mpg', agg='mean', legend='top_right', title='inferred labels')

output_file("dots_multi.html", title="dots_multi.py example")

show(gridplot(dot_plot,  dot_plot2, dot_plot3, dot_plot4,
              dot_plot5, dot_plot6, dot_plot7, dot_plot8,
              dot_plot9, ncols=2))
