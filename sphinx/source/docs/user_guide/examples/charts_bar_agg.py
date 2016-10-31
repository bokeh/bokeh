from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Bar(df, label='yr', values='mpg', agg='mean',
        title="Average MPG by YR")

output_file("bar.html")

show(p)
