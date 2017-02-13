import pandas as pd

from bokeh.charts import Scatter, output_file, defaults, show
from bokeh.charts.operations import blend
from bokeh.charts.utils import df_from_json
from bokeh.layouts import gridplot
from bokeh.sampledata.autompg import autompg as df
from bokeh.sampledata.iris import flowers
from bokeh.sampledata.olympics2014 import data

defaults.plot_width = 450
defaults.plot_height = 400
tooltips = [("Cylinders", "@cyl"),
            ("Displacement", "@displ"),
            ("Weight", "@weight"),
            ("Acceleration", "@accel"),
            ("Horsepower", "@hp"),
            ("Miles Per Gallon", "@mpg"),
            ("Origin", "@origin")]

scatter0 = Scatter(
    df, x='mpg', title="x='mpg'", xlabel="Miles Per Gallon", tooltips=tooltips)

scatter1 = Scatter(
    df, x='mpg', y='hp', title="x='mpg', y='hp'",
    xlabel="Miles Per Gallon", ylabel="Horsepower", legend='top_right',
    tooltips=tooltips)

scatter2 = Scatter(
    df, x='mpg', y='hp', color='cyl', title="x='mpg', y='hp', color='cyl'",
    xlabel="Miles Per Gallon", ylabel="Horsepower", legend='top_right',
    tooltips=tooltips)

scatter3 = Scatter(
    df, x='mpg', y='hp', color='origin', title="x='mpg', y='hp', color='origin', with tooltips",
    xlabel="Miles Per Gallon", ylabel="Horsepower",
    legend='top_right', tooltips=tooltips)

scatter4 = Scatter(
    df, x='mpg', y='hp', color='cyl', marker='origin', title="x='mpg', y='hp', color='cyl', marker='origin'",
    xlabel="Miles Per Gallon", ylabel="Horsepower", legend='top_right',
    tooltips=tooltips)

# Example with nested json/dict like data, which has been pre-aggregated and pivoted
df2 = df_from_json(data)
df2 = df2.sort_values(by='total', ascending=False)

df2 = df2.head(10)
df2 = pd.melt(df2, id_vars=['abbr', 'name'])

scatter5 = Scatter(
    df2, x='value', y='name', color='variable', title="x='value', y='name', color='variable'",
    xlabel="Medals", ylabel="Top 10 Countries", legend='bottom_right')

scatter6 = Scatter(flowers, x=blend('petal_length', 'sepal_length', name='length'),
                   y=blend('petal_width', 'sepal_width', name='width'), color='species',
                   title='x=petal_length+sepal_length, y=petal_width+sepal_width, color=species',
                   legend='top_right')

output_file("scatter_multi.html", title="scatter_multi.py example")

show(gridplot(scatter0,  scatter2, scatter3, scatter4,
              scatter5, scatter6, ncols=2))
