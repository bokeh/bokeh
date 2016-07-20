from bokeh.plotting import figure, show, output_file

p = figure(plot_width=300, plot_height=300)
p.circle([1,2], [3,4])

# configure visual properties on a plot's title attribute
p.title.text = "Title With Options"
p.title.align = "right"
p.title.text_color = "orange"
p.title.text_font_size = "25px"
p.title.background_fill_color = "#aaaaee"

output_file("title.html")

show(p)
