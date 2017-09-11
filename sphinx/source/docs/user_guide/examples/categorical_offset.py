from bokeh.io import show, output_file
from bokeh.plotting import figure

output_file("offset.html")

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

p = figure(x_range=fruits, plot_height=250, title="Fruit Counts",
           toolbar_location=None, tools="")

offsets = [-0.5, -0.2, 0.0, 0.3, 0.1, 0.3]

# This results in [ ['Apples', -02], ['Pears', -0.1], ... ]
x = list(zip(fruits, offsets))

p.vbar(x=x, top=[5, 3, 4, 2, 4, 6], width=0.5)

p.xgrid.grid_line_color = None
p.y_range.start = 0

show(p)
