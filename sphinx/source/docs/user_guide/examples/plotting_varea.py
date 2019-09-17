from bokeh.plotting import figure, output_file, show

output_file("varea.html")

p = figure(plot_width=400, plot_height=400)

p.varea(x=[1, 2, 3, 4, 5],
        y1=[2, 6, 4, 3, 5],
        y2=[1, 4, 2, 2, 3])

show(p)
