from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.outline_line_width = 7
p.outline_line_alpha = 0.3
p.outline_line_color = "navy"

p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

show(p)
