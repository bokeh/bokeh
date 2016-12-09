from bokeh.plotting import figure, output_file, show

output_file("background.html")

p = figure(plot_width=400, plot_height=400)
p.background_fill_color = "beige"
p.background_fill_alpha = 0.5

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
