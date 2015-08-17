from bokeh.plotting import figure, output_file, show

output_file("title.html")

# create a new plot with a title
p = figure(plot_width=400, plot_height=400, title="Some Title")
p.title_text_color = "olive"
p.title_text_font = "times"
p.title_text_font_style = "italic"

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)

