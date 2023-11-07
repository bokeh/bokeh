from bokeh.plotting import figure, show

p = figure(width=400, height=400, title="Some Title")
p.title.text_color = "olive"
p.title.text_font = "times"
p.title.text_font_style = "italic"

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
