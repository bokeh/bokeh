''' A grouped bar chart using a cleaned up version of the `Auto MPG dataset`_.
This examples demonstrates automatic handing of Pandas GroupBy objects and
colormapping nested factors with ``factor_cmap``. A hover tooltip displays
information for each bar.

.. bokeh-example-metadata::
    :sampledata: autompg
    :apis: bokeh.plotting.figure.vbar, bokeh.transform.factor_cmap
    :refs: :ref:`ug_basic_bars_pandas`
    :keywords: bars, categorical, colormap, groupby, pandas

.. _Auto MPG dataset: https://archive.ics.uci.edu/ml/datasets/auto+mpg

'''
from bokeh.palettes import MediumContrast5
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg import autompg_clean as df
from bokeh.transform import factor_cmap

df.cyl = df.cyl.astype(str)
df.yr = df.yr.astype(str)

group = df.groupby(['cyl', 'mfr'])

index_cmap = factor_cmap('cyl_mfr', palette=MediumContrast5, factors=sorted(df.cyl.unique()), end=1)

p = figure(width=800, height=300, title="Mean MPG by # Cylinders and Manufacturer",
           x_range=group, toolbar_location=None, tooltips=[("MPG", "@mpg_mean"), ("Cyl, Mfr", "@cyl_mfr")])

p.vbar(x='cyl_mfr', top='mpg_mean', width=1, source=group,
       line_color="white", fill_color=index_cmap )

p.y_range.start = 0
p.x_range.range_padding = 0.05
p.xgrid.grid_line_color = None
p.xaxis.axis_label = "Manufacturer grouped by # Cylinders"
p.xaxis.major_label_orientation = 1.2
p.outline_line_color = None

show(p)
