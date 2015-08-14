
from bokeh.charts import Scatter, output_file, show, vplot
from bokeh.sampledata.autompg import autompg as df

scatter = Scatter(
    df, x='mpg', y='hp', title="hp vs mpg",
    xlabel="Miles Per Gallon", ylabel="Horsepower")

# scatter4 = Scatter(
#     list(xyvalues.values()), title="iris dataset, dict_input",
#     xlabel="petal_length", ylabel="petal_width", legend='top_left')

output_file("scatter.html")

show(vplot(scatter))
