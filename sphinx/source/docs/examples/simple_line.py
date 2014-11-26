from bokeh.plotting import figure, output_file, show

#prepare some data
x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]

# output to static HTML file
output_file("lines.html", title="line plot example")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
p = figure(title="simple line example")
p.line(x, y, legend="Temp.", x_axis_label='x', y_axis_label='y')

show(p)
