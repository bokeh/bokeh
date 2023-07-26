from bokeh.plotting import figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 8, 7, 3]

p = figure(width=400, height=400)

# add both a line and circles on the same plot
p.line(x, y, line_width=2)
p.scatter(x, y, fill_color="white", size=8)

show(p)
