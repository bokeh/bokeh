from bokeh.charts import Scatter, output_file, show
from bokeh.sampledata.autompg import autompg as df

p = Scatter(df, x='mpg', y='hp', title="HP vs MPG", color="navy",
            xlabel="Miles Per Gallon", ylabel="Horsepower")

output_file("scatter.html")

show(p)
