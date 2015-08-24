from bokeh.charts import Bar, output_file, show, vplot, hplot
from bokeh.models import Range1d
from bokeh.sampledata.autompg import autompg as df

width = 700
height = 500
legend_position = "top_right"

bar_plot = Bar(
    df, label='cyl', values='mpg', stack='cyl', agg='mean',
    title="label='cyl' values='mpg', agg='mean'",
    ylabel="Mean(mpg)", xlabel="Cylinder", width=width, height=height
)

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

show(bar_plot)
