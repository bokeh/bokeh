from bokeh.plotting import figure, output_file, show

p = figure(title="Left Title", title_location="left",
           plot_width=300, plot_height=300)
p.circle([1,2], [3,4])

output_file("title.html")

show(p)
