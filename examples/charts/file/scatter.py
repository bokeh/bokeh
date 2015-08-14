
from bokeh.charts import Scatter, output_file, show, vplot, hplot
from bokeh.sampledata.autompg import autompg as df

scatter = Scatter(
    df, x='mpg', y='hp', title="x='mpg', y='hp'",
    xlabel="Miles Per Gallon", ylabel="Horsepower")

scatter1 = Scatter(
    df, x='mpg', y='hp', color='cyl', title="x='mpg', y='hp', color='cyl'",
    xlabel="Miles Per Gallon", ylabel="Horsepower")

scatter2 = Scatter(
    df, x='mpg', y='hp', color='origin', title="x='mpg', y='hp', color='origin'",
    xlabel="Miles Per Gallon", ylabel="Horsepower")

scatter3 = Scatter(
    df, x='mpg', y='hp', color='cyl', marker='origin', title="x='mpg', y='hp', color='cyl', marker='origin'",
    xlabel="Miles Per Gallon", ylabel="Horsepower")

output_file("scatter.html")

show(vplot(hplot(scatter, scatter1), hplot(scatter2, scatter3)))
