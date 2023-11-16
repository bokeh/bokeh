from bokeh.plotting import figure, show

p = figure(width=300, height=300)

p.scatter([1, 2], [3, 4])

# configure visual properties on a plot's title attribute
p.title.text = "Title With Options"
p.title.align = "right"
p.title.text_color = "orange"
p.title.text_font_size = "25px"
p.title.background_fill_color = "#aaaaee"

show(p)
