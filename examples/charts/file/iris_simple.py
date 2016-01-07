from bokeh.charts import Scatter, output_file, show
from bokeh.sampledata.iris import flowers as data

scatter = Scatter(data, x='petal_length', y='petal_width',
                  color='species', marker='species',
                  title='Iris Dataset Color and Marker by Species',
                  legend=True)

output_file("iris_simple.html", title="iris_simple.py example")

show(scatter)
