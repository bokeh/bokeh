import math

from bokeh.layouts import row
from bokeh.plotting import curdoc, figure, show

curdoc().theme = 'fresh'

categories = ['A', 'B', 'C', 'D', 'E']
values = [28, 55, 43, 18, 37]

p1 = figure(
    x_range=categories, title="Bar Chart", width=350, height=300,
    toolbar_location=None,
)
p1.vbar(x=categories, top=values, width=0.7, color="#3B82F6")
p1.xaxis.axis_label = "Category"
p1.yaxis.axis_label = "Value"
p1.y_range.start = 0

x = [i * 0.1 for i in range(100)]
y1 = [math.sin(v) for v in x]
y2 = [math.cos(v) for v in x]

p2 = figure(title="Line Chart", width=350, height=300, toolbar_location=None)
p2.line(x, y1, legend_label="sin(x)", line_width=2, color="#3B82F6")
p2.line(x, y2, legend_label="cos(x)", line_width=2, color="#F97316", line_dash="dashed")
p2.xaxis.axis_label = "x"
p2.yaxis.axis_label = "y"
p2.legend.location = "top_right"

show(row(p1, p2))
