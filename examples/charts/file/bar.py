from bokeh.charts import Bar, output_file, show, vplot, hplot, defaults
from bokeh.sampledata.autompg import autompg as df

defaults.width = 400
defaults.height = 250

bar_plot = Bar(df, label='cyl', title="label='cyl'")

bar_plot2 = Bar(df, label='cyl', bar_width=0.4, title="label='cyl' bar_width=0.4")

bar_plot3 = Bar(df, label='cyl', values='mpg', agg='mean',
                title="label='cyl' values='mpg' agg='mean'")

bar_plot4 = Bar(df, label='cyl', title="label='cyl' color='DimGray", color='DimGray')

# multiple columns
bar_plot5 = Bar(df, label=['cyl', 'origin'], values='mpg', agg='mean',
                title="label='cyl' values='mpg' agg='mean'")

# np_negative_grouped = Bar(
#     random * -1, cat=categories, title="All negative input | Grouped",
#     ylabel="Random Number", width=width, height=height
# )
#
# np_custom = Bar(
#     mixed, cat=categories, title="Custom range (start=-3, end=0.4)",
#     ylabel="Random Number", width=width, height=height,
#     continuous_range=Range1d(start=-3, end=0.4)
# )
#
# np_mixed_grouped = Bar(
#     mixed, cat=categories, title="Mixed-sign input | Grouped",
#     ylabel="Random Number", width=width, height=height
# )

# collect and display
output_file("bar.html")

show(
    vplot(
        hplot(bar_plot, bar_plot2),
        hplot(bar_plot3, bar_plot4),
        hplot(bar_plot5)
    )
)
