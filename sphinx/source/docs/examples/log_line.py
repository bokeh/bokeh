from bokeh.plotting import figure, output_file, show

# prepare some data
x0 = [1, 2, 3, 4, 5]
y1 = [x**2 for x in x0]
y2 = [10**x for x in x0]
y3 = [10**(x**2) for x in x0]

# output to static HTML file
output_file("log_lines.html")

# create a new figure
p = figure(
    tools="pan,box_zoom,reset,previewsave",
    y_axis_type="log", y_range=[0.001, 10**22], title="log axis example",
    x_axis_label='sections', y_axis_label='particles'
)

# create plots!
p.line(x0, x0, legend="y=x")
p.circle(x0, x0, legend="y=x")
p.line(x0, y1, legend="y=x**2")
p.circle(x0, y1, fill_color=None, line_color="green", legend="y=x**2")
p.line(x0, y2, line_color="red", line_width=2, legend="y=10^x")
p.line(x0, y3, line_color="orange", line_width=2, legend="y=10^(x^2)")

show()
