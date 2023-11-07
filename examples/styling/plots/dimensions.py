from bokeh.plotting import figure, show

# create a new plot with specific dimensions
p = figure(width=700)
p.height = 300

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
