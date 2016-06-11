import numpy as np

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, gridplot, show, output_file

N = 300
x = np.linspace(0, 4*np.pi, N)
y1 = np.sin(x)
y2 = np.cos(x)

source = ColumnDataSource(data=dict(x=x, y1=y1, y2=y2))

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select,lasso_select"

s1 = figure(tools=TOOLS, title="Figure 1", min_border=5)

s1.circle('x', 'y1', source=source)

s2 = figure(tools=TOOLS)

# linked brushing is expressed by sharing data sources between renderers
s2.circle('x', 'y2', source=source)

p = gridplot([[s1,s2]])

output_file("linked_brushing.html", title="linked_brushing.py example")

show(p)
