from bokeh.plotting import figure, output_file, show

output_file("axes.html")

p = figure(plot_width=400, plot_height=400)
p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

# change just some things about the x-axis
p.x_axis.axis_label = "Temp"
p.x_axis.axis_line_width = 3
p.x_axis.axis_line_color = "red"

# change just some things about the y-axis
p.y_axis.axis_label = "Pressure"
p.y_axis.major_label_text_color = "orange"
p.y_axis.major_label_orientation = "vertical"

# change things on all axes
p.axis.minor_tick_in = -3
p.axis.minor_tick_out = 6

show(p)
