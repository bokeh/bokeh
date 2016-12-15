from bokeh.plotting import figure, output_file, show

output_file("border.html")

p = figure(plot_width=400, plot_height=400)
p.border_fill_color = "whitesmoke"
p.min_border_left = 80

p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

show(p)
