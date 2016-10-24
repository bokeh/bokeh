from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Bar(df, 'yr', values='displ',
        title="Total DISPL by YR", color="wheat")

output_file("bar.html")

show(p)
