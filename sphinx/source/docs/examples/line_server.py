from bokeh.plotting import figure, output_server, show

#prepare some data
x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]

# output to static HTML file
output_server("simple_line")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
p = figure(title="simple line server example")
p.line(x, y, legend="Temp.", x_axis_label='x', y_axis_label='y')

show(p)
