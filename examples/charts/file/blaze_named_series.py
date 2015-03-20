from os.path import dirname, join
from blaze import Data
import pandas as pd
import numpy as np
from bokeh.sampledata import iris
from bokeh.charts import * #Line, show, output_file, vplot, hplot, Step, Area

bbvalues = Data(join(dirname(iris.__file__), 'iris.csv'))
# columns = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
# # result = bbvalues[columns]
output_file("blaze_input.html")
line = Line(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Line Chart", width=300, height=300,
    ylabel='Petals', notebook=True, legend="top_left"
)
df = pd.DataFrame(np.asarray(bbvalues))
df['myx'] = range(100, 100+bbvalues.nrows)
line2 = Line(
    df, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    # x_names = ['myx'],
    index = ['myx'], width=400, height=300,
    title="Line Chart",
    ylabel='Petals', notebook=True, legend="top_left"
)
step = Step(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Step Chart", width=400, height=300,
    ylabel='Petals', notebook=True, legend="top_left"
)
area = Area(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Step Chart", width=400, height=300, #stacked=True,
    ylabel='Petals', notebook=True, legend="top_left"
)
bp = BoxPlot(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="BoxPlot", width=400, height=500,
    ylabel='Petals', notebook=True,
)
donut = BoxPlot(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="BoxPlot", width=400, height=500,
    ylabel='Petals', notebook=True,
)
show(
    vplot(
        hplot(bp, donut),
        hplot(line, line2),
        hplot(step, area),
    )
)