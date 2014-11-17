from bokeh.plotting import *

# prepare some data
x = [1, 2, 3, 4, 5]
y1 = [el**2 for el in x]
y2 = [10**el for el in x]
y3 = [10**(el**2) for el in x]

# output to static HTML file
output_file("lines.html")

# create a new figure
figure(
    tools="pan,box_zoom,reset,previewsave",
    y_axis_type="log", y_range=[0.001, 10**22], title="log axis example",
    x_axis_label='sections', y_axis_label='particles'
)

# tell plotting to group all next plots into the same figure
hold()

# create plots!
line(x, x, legend="y=x")
circle(x, x, legend="y=x")
line(x, y1, legend="y=x**2")
circle(x, y1, fill_color=None, line_color="green", legend="y=x**2")
line(x, y2, line_color="red", line_width=2, legend="y=10^x")
line(x, y3, line_color="orange", line_width=2, legend="y=10^(x^2)")

show()
