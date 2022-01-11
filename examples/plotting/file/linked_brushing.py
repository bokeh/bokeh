'''An example of linked brushing with two scatter plots showing two views of the same data.
   One representing # Cylinders vs. MPG and the second graph representing acceleration vs. MPG

.. bokeh-example-metadata::
    :sampledata: autompg
    :apis: bokeh.plotting.Figure.circle
    :refs: :ref:`plotting_scatter` > :ref:`plotting_scatter_circle`
    :keywords: scatter, linked brushing

'''
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.autompg import autompg
from bokeh.transform import jitter

source = ColumnDataSource(autompg)

TOOLS = "save,box_select,lasso_select"

s1 = figure(tools=TOOLS, width=400, height=400,
            x_axis_label='# Cylinders', y_axis_label='MPG')

s1.circle(jitter('cyl', 0.5), 'mpg', source=source)

s2 = figure(tools=TOOLS, width=400, height=400,
            x_axis_label='Acceleration', y_axis_label='MPG')

# linked brushing is expressed by sharing data sources between renderers
s2.circle('accel', 'mpg', source=source)

output_file("linked_brushing.html", title="linked_brushing.py example")

show(row(s1,s2))
