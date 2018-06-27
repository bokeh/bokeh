from bokeh.io import curdoc, show
from bokeh.plotting import figure

p = figure(title='Hello world!')
p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)
curdoc().add_root(p)
show(p)
