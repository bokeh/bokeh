from os.path import dirname, join
from blaze import Data
import pandas as pd
import numpy as np
from bokeh.sampledata import iris
from bokeh.charts import *
from bokeh.models.widgets import Panel, Tabs

bbvalues = Data(join(dirname(iris.__file__), 'iris.csv'))
output_file("blaze_input.html")

df = pd.DataFrame(np.asarray(bbvalues))
df['myx'] = range(100, 100+bbvalues.nrows)
datasource = ColumnDataSource(data=df)

pkws = dict(
    width=500, height=400,
    tools="pan,wheel_zoom,box_zoom,reset,save,box_select,lasso_select",
    legend="top_left",
    ylabel='Petals'
)

ys = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
ys_sh = ['sepal_length', 'petal_length']
xs_sh = ['sepal_width', 'petal_width']



scatter1 = Scatter(datasource, y=ys, title="Scatter Chart", **pkws)
scatter2 = Scatter(datasource, y=ys_sh, x=xs_sh,
                   title="Scatter Length X Width", **pkws)
line = Line(bbvalues, y=ys, title="Line Chart", **pkws)
# area = Area(bbvalues, y=ys, title="Area Chart", **pkws)

mix = Line(df, y=ys, x='myx', width=1000, height=500,
           title="Mixed Chart", ylabel='Petals', legend="top_left")
Scatter(df, y=ys, x=['myx'], chart=mix)

line2 = Line(datasource, y=ys, x=['myx'], **pkws)
step = Step(datasource, y=ys, x=['myx'],
            title="Step Chart",
            x_range=line2.x_range, y_range=line2.y_range,
            **pkws)

area = Area(bbvalues, y=ys, title="Area Chart", **pkws)
bp = BoxPlot(bbvalues, title="BoxPlot", y=ys, width=400, height=400,)
hist = Histogram(bbvalues, bins=10, y=ys, title="Histogram Chart", width=400, height=400)
singleline = Line(df, y='sepal_length', x='myx', width=400,
                  height=400, title="Single Line", legend=True)
show(
    vplot(
        Tabs(tabs=[
            Panel(child=hplot(scatter1, scatter2), title="Linked Brushing"),
            Panel(child=hplot(step, line2), title="Linked Panning"),
        ]),
        mix,
        hplot(bp, hist, singleline),
        hplot(line, area),
    )
)