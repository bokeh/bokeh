from bokeh.plotting import figure, output_file, show

x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
y = [10**xx for xx in x]

output_file("log.html")

# create a new plot with a log axis type
p = figure(plot_width=400, plot_height=400, y_axis_type="log")

p.line(x, y, line_width=2)
p.circle(x, y, fill_color="white", size=8)

show(p)
