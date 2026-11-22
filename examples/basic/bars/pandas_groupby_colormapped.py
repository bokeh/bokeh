''' A bar chart using the `Auto MPG dataset <https://archive.ics.uci.edu/ml/datasets/auto+mpg>`__. This example demonstrates
automatic handling of Pandas GroupBy objects and colormapping with
``factor_cmap``.

.. bokeh-example-metadata::
    :title: Fuel economy by cylinder count
    :keywords: bars, categorical, colormap, groupby, pandas
    :apis: bokeh.plotting.figure.vbar, bokeh.transform.factor_cmap
    :sampledata: autompg
    :refs: :ref:`ug_basic_bars_pandas`
    :gallery: A bar chart of MPG vs cylinders using the Auto MPG dataset, colormapped by the number of cylinders.


'''
from bokeh.palettes import Spectral5
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg import autompg as df
from bokeh.transform import factor_cmap

df.cyl = df.cyl.astype(str)
group = df.groupby('cyl')

cyl_cmap = factor_cmap('cyl', palette=Spectral5, factors=sorted(df.cyl.unique()))

p = figure(height=350, x_range=group, title="MPG by # Cylinders",
           tools=None)

p.vbar(x='cyl', top='mpg_mean', width=1, source=group,
       line_color=cyl_cmap, fill_color=cyl_cmap)

p.y_range.start = 0
p.xgrid.grid_line_color = None
p.xaxis.axis_label = "some stuff"
p.xaxis.major_label_orientation = 1.2
p.outline_line_color = None

show(p)
