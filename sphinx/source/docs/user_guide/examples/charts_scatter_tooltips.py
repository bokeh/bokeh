from bokeh.charts import Scatter, output_file, show
from bokeh.sampledata.autompg import autompg as df

tooltips=[
    ('Cylinders', '@cyl'),
    ('Displacement', '@displ'),
    ('Weight', '@weight'),
    ('Acceleration', '@accel')
]

p = Scatter(df, x='mpg', y='hp', title="HP vs MPG",
            xlabel="Miles Per Gallon", ylabel="Horsepower",
            tooltips=tooltips)

output_file("scatter.html")

show(p)
