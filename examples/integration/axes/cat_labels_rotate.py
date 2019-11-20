from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import FactorRange
from bokeh.plotting import figure

xr = [('foo', 'bar'), ('foo', 'baz'), ('quux', 'bar')]
p1 = figure(plot_height=300, x_range=FactorRange(*xr), toolbar_location=None)
p1.xaxis.major_label_orientation = 1.2
p1.xaxis.group_label_orientation = "normal"
p1.vbar(x=xr, top=1, width=0.5)

xr = [('A', 'foo', 'bar'), ('B', 'foo', 'baz'), ('B', 'quux', 'bar')]
p2 = figure(plot_height=300, x_range=FactorRange(*xr), toolbar_location=None)
p2.xaxis.major_label_orientation = 1.2
p2.xaxis.subgroup_label_orientation = "vertical"
p2.xaxis.group_label_orientation = 0.8
p2.vbar(x=xr, top=1, width=0.5)

show(column(p1, p2))
