''' Two scatter plots in a grid. This example demonstrate the application of a
``jitter`` transform to data.

.. bokeh-example-metadata::
    :sampledata: autompg
    :apis: bokeh.plotting.figure.scatter, bokeh.layouts.column, bokeh.transform.jitter
    :refs: :ref:`ug_basic_data_transforming`
    :keywords: column, jitter, scatter

'''
from bokeh.layouts import column
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg import autompg
from bokeh.transform import jitter

years = sorted(autompg.yr.unique())

p1 = figure(width=600, height=300, title="Years vs mpg without jittering")
p1.xgrid.grid_line_color = None
p1.xaxis.ticker = years

p1.scatter(x='yr', y='mpg', size=9, alpha=0.4, source=autompg)

p2 = figure(width=600, height=300, title="Years vs mpg with jittering")
p2.xgrid.grid_line_color = None
p2.xaxis.ticker = years

p2.scatter(x=jitter('yr', 0.4), y='mpg', size=9, alpha=0.4, source=autompg)

show(column(p1, p2))
