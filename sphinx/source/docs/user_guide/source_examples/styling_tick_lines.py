from bokeh.plotting import figure, output_file, show

output_file("axes.html")

p = figure(plot_width=400, plot_height=400)
p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis.major_tick_line_color = "firebrick"
p.xaxis.major_tick_line_width = 3
p.xaxis.minor_tick_line_color = "orange"

p.yaxis.minor_tick_line_color = None

p.axis.major_tick_out = 10
p.axis.minor_tick_in = -3
p.axis.minor_tick_out = 8

show(p)
