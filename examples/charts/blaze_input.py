from __future__ import print_function
from os.path import dirname, join
from bokeh.sampledata import iris
from bokeh.charts import Line, show, output_file

try:
    from blaze import Data
    bbvalues = Data(join(dirname(iris.__file__), 'iris.csv'))
except ImportError:
    print ("WARNING!!!! Unable to import blaze, switching to pandas!")
    import pandas as pd
    bbvalues = pd.read_csv(join(dirname(iris.__file__), 'iris.csv'))

columns = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
result = bbvalues[columns]
output_file("blaze_input.html")
line = Line(
    result, title="Line Chart", ylabel='Petals', notebook=True, legend="top_left"
)
show(line)