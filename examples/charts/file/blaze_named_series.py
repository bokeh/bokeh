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


scatter1 = Scatter(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Scatter Chart", width=300, height=300,
    ylabel='Petals', legend="top_left"
)
scatter2 = Scatter(
    bbvalues, y_names = ['sepal_length', 'petal_length'],
    x_names = ['sepal_width', 'petal_width'],
    title="Scatter Length X Width", width=300, height=300,
    ylabel='Petals', legend="top_left"
)
line = Line(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Line Chart", width=300, height=300,
    ylabel='Petals', legend="top_left"
)
df = pd.DataFrame(np.asarray(bbvalues))
df['myx'] = range(100, 100+bbvalues.nrows)

mix = Line(
    df, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    index = ['myx'], width=1000, height=500,
    title="Mixed Chart",
    ylabel='Petals', legend="top_left"
)
Scatter(
    df, y_names=['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    x_names=['myx'],
    chart=mix
)
datasource = ColumnDataSource(data=df)
line2 = Line(
    datasource, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    x_names = ['myx'],
    # index = ['myx'],
    width=400, height=300,
    title="Line Chart",
    ylabel='Petals', legend="top_left"
)

step = Step(
    datasource, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Step Chart", width=400, height=300,
    ylabel='Petals', legend="top_left"
)

area = Area(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="Step Chart", width=400, height=300, #stacked=True,
    ylabel='Petals', legend="top_left"
)
bp = BoxPlot(
    bbvalues, y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="BoxPlot", width=400, height=500,
    ylabel='Petals'
)
hist = Histogram(
    bbvalues, bins=10,
    y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="BoxPlot", width=400, height=500,
    ylabel='Petals'
)
hist = Histogram(
    bbvalues, bins=10,
    y_names = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
    title="BoxPlot", width=400, height=500,
    ylabel='Petals'
)

show(
    vplot(
        mix,
        hplot(scatter1, scatter2),
        hplot(bp, hist),
        hplot(line, line2),
        hplot(step, area),
    )
)