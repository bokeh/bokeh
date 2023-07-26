from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.background_fill_color = "beige"
p.background_fill_alpha = 0.5

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
