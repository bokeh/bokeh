from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Bar(df, label='yr', values='mpg', agg='median', group='origin',
        title="Median MPG by YR, grouped by ORIGIN", legend='top_right')

output_file("bar.html")

show(p)
