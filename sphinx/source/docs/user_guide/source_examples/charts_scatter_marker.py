from bokeh.charts import Scatter, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Scatter(df, x='displ', y='hp', marker='square',
            title="HP vs DISPL", legend="top_left",
            xlabel="Displacement", ylabel="Horsepower")

output_file("scatter.html")

show(p)
