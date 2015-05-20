# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import figure, gridplot, show, output_server
from bokeh.models import ColumnDataSource

output_server("linked_brushing")

N = 300
x = np.linspace(0, 4*np.pi, N)
y1 = np.sin(x)
y2 = np.cos(x)

source = ColumnDataSource()
source.add(data=x, name='x')
source.add(data=y1, name='y1')
source.add(data=y2, name='y2')

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select,lasso_select"

s1 = figure(tools=TOOLS, plot_width=350, plot_height=350)
s1.scatter('x', 'y1', source=source)

# Linked brushing in Bokeh is expressed by sharing data sources between
# renderers. Note below that s2.scatter is called with the `source`
# keyword argument, and supplied with the same data source from s1.scatter
s2 = figure(tools=TOOLS, plot_width=350, plot_height=350)
s2.scatter('x', 'y2', source=source)

p = gridplot([[s1,s2]])
show(p)
