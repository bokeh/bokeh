from bokeh.plotting import figure, output_file, show

output_file("title.html")

p = figure(plot_width=400, plot_height=400, title="Some Title")
p.title.text_color = "olive"
p.title.text_font = "times"
p.title.text_font_style = "italic"

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
