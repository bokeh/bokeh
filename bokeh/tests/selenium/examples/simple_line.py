from bokeh.plotting import figure, output_server, show

x = [1, 2, 3, 4, 5, 6, 7]
y = [5, 5, 7, 7, 8, 8, 9]

output_server("test_document")

p = figure(title="simple line server example")
p.line(x, y, x_axis_label='x', y_axis_label='y')
