""" This example uses the Iris data to demonstrate the specification of
combined variables using chart operations.

This specific instance uses a blend, which stacks columns, and renames
the combined column. This can be used where the column itself is a type
of categorical variable. Here, length and width are derived from the
petal and sepal measurements.
"""

from bokeh.charts import Scatter, output_file, show
from bokeh.charts.operations import blend
from bokeh.sampledata.iris import flowers as data

scatter = Scatter(data,
                  x=blend('petal_length', 'sepal_length', name='length'),
                  y=blend('petal_width', 'sepal_width', name='width'),
                  color='species',
                  title='x=petal_length+sepal_length, y=petal_width+sepal_width, color=species',
                  legend='top_right')

output_file("iris_blend.html", title="iris_blend.py example")

show(scatter)
