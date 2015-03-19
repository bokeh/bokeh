from os.path import dirname, join
from blaze import Data
import pandas as pd
import numpy as np
from bokeh.sampledata import iris
from bokeh.charts import Line, show, output_file, vplot, hplot, Step

bbvalues = Data(join(dirname(iris.__file__), 'iris.csv'))
# columns = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
# # result = bbvalues[columns]
output_file("blaze_input.html")
line = Line(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Line Chart",
    ylabel='Petals', notebook=True, legend="top_left"
)
df = pd.DataFrame(np.asarray(bbvalues))
df['myx'] = range(100, 100+bbvalues.nrows)
line2 = Line(
    df, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    # x_names = ['myx'],
    index = ['myx'],
    title="Line Chart",
    ylabel='Petals', notebook=True, legend="top_left"
)
step = Step(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Step Chart",
    ylabel='Petals', notebook=True, legend="top_left"
)
show(
    vplot(
        hplot(line, line2),
        step
    )
)