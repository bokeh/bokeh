from bokeh.charts import Bar, output_file, show, vplot, hplot, defaults
from bokeh.sampledata.autompg import autompg as df

df['neg_mpg'] = 0 - df['mpg']

defaults.plot_width = 400
defaults.plot_height = 400

bar_plot = Bar(df, label='cyl', title="label='cyl'")
bar_plot.title_text_font_size = '10pt'

bar_plot2 = Bar(df, label='cyl', bar_width=0.4, title="label='cyl' bar_width=0.4")
bar_plot2.title_text_font_size = '10pt'

bar_plot3 = Bar(df, label='cyl', values='mpg', agg='mean',
                title="label='cyl' values='mpg' agg='mean'")
bar_plot3.title_text_font_size = '10pt'

bar_plot4 = Bar(df, label='cyl', title="label='cyl' color='DimGray'", color='dimgray')
bar_plot4.title_text_font_size = '10pt'

# multiple columns
bar_plot5 = Bar(df, label=['cyl', 'origin'], values='mpg', agg='mean',
                title="label=['cyl', 'origin'] values='mpg' agg='mean'")
bar_plot5.title_text_font_size = '10pt'

bar_plot6 = Bar(df, label='origin', values='mpg', agg='mean', stack='cyl',
                title="label='origin' values='mpg' agg='mean' stack='cyl'",
                legend='top_right')
bar_plot6.title_text_font_size = '10pt'

bar_plot7 = Bar(df, label='cyl', values='displ', agg='mean', group='origin',
                title="label='cyl' values='displ' agg='mean' group='origin'",
                legend='top_right')
bar_plot7.title_text_font_size = '10pt'

bar_plot8 = Bar(df, label='cyl', values='neg_mpg', agg='mean', group='origin',
                color='origin', legend='top_right',
                title="label='cyl' values='neg_mpg' agg='mean' group='origin'")
bar_plot8.title_text_font_size = '9pt'

# infer labels from index
df = df.set_index('cyl')
bar_plot9 = Bar(df, values='mpg', agg='mean', legend='top_right', title='inferred labels')
bar_plot9.title_text_font_size = '10pt'

output_file("bar_multi.html", title="bar_multi.py example")

show(vplot(
    hplot(bar_plot,  bar_plot2),
    hplot(bar_plot3, bar_plot4),
    hplot(bar_plot5, bar_plot6),
    hplot(bar_plot7, bar_plot8),
    hplot(bar_plot9)
))
