from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.autompg import autompg
from bokeh.transform import jitter

source = ColumnDataSource(autompg)

TOOLS = "save,box_select,lasso_select"

s1 = figure(tools=TOOLS, plot_width=400, plot_height=400,
            x_axis_label='# Cylinders', y_axis_label='MPG')

s1.circle(jitter('cyl', 0.5), 'mpg', source=source)

s2 = figure(tools=TOOLS, plot_width=400, plot_height=400,
            x_axis_label='Acceleration', y_axis_label='MPG')

# linked brushing is expressed by sharing data sources between renderers
s2.circle('accel', 'mpg', source=source)

output_file("linked_brushing.html", title="linked_brushing.py example")

show(row(s1,s2))
