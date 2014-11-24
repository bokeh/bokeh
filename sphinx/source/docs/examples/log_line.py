from bokeh.plotting import *

# prepare some data
x = [1, 2, 3, 4, 5]
y1 = [el**2 for el in x]
y2 = [10**el for el in x]
y3 = [10**(el**2) for el in x]

# create a new figure
p = figure(
    tools="pan,box_zoom,reset,previewsave",
    y_axis_type="log", y_range=[0.001, 10**22], title="log axis example",
    x_axis_label='sections', y_axis_label='particles'
)

# create plots!
p.line(x, x, legend="y=x")
p.circle(x, x, legend="y=x")
p.line(x, y1, legend="y=x**2")
p.circle(x, y1, fill_color=None, line_color="green", legend="y=x**2")
p.line(x, y2, line_color="red", line_width=2, legend="y=10^x")
p.line(x, y3, line_color="orange", line_width=2, legend="y=10^(x^2)")

# output to static HTML file
output_file("lines.html")

show()
