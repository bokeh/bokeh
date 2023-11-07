from bokeh.plotting import figure, show

x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
y = [10**xx for xx in x]

# create a new plot with a log axis type
p = figure(width=400, height=400, y_axis_type="log")

p.line(x, y, line_width=2)
p.scatter(x, y, fill_color="white", size=8)

show(p)
