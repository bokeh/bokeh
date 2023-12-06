from bokeh.plotting import figure, show

# prepare some data
x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
y0 = [i**2 for i in x]
y1 = [10**i for i in x]
y2 = [10**(i**2) for i in x]

# create a new plot with a logarithmic axis type
p = figure(
    title="Logarithmic axis example",
    sizing_mode="stretch_width",
    height=300,
    max_width=500,
    y_axis_type="log",
    y_range=[0.001, 10 ** 11],
    x_axis_label="sections",
    y_axis_label="particles",
)

# add some renderers
p.line(x, x, legend_label="y=x")
p.scatter(x, x, legend_label="y=x", fill_color="white", size=8)
p.line(x, y0, legend_label="y=x^2", line_width=3)
p.line(x, y1, legend_label="y=10^x", line_color="red")
p.scatter(x, y1, legend_label="y=10^x", fill_color="red", line_color="red", size=6)
p.line(x, y2, legend_label="y=10^x^2", line_color="orange", line_dash="4 4")

# show the results
show(p)
