import numpy as np

from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show, output_file

N = 300
x = np.linspace(0, 4*np.pi, N)
y1 = np.sin(x)
y2 = np.cos(x)

source = ColumnDataSource(data=dict(x=x, y1=y1, y2=y2))

TOOLS = "save,box_select,lasso_select"

s1 = figure(tools=TOOLS)

s1.circle('x', 'y1', source=source)

s2 = figure(tools=TOOLS)

# linked brushing is expressed by sharing data sources between renderers
s2.circle('x', 'y2', source=source)

p = gridplot([[s1,s2]], plot_width=400, plot_height=400)

output_file("linked_brushing.html", title="linked_brushing.py example")

show(p)
