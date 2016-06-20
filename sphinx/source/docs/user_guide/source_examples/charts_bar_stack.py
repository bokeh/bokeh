from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Bar(df, label='origin', values='mpg', agg='mean', stack='cyl',
        title="Avg MPG by ORIGIN, stacked by CYL", legend='top_right')

output_file("bar.html")

show(p)
