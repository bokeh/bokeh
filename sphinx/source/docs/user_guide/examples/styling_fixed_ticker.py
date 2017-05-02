from bokeh.plotting import figure, output_file, show

output_file("fixed_ticks.html")

p = figure(plot_width=400, plot_height=400)
p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis.ticker = [2, 3.5, 4]

show(p)
