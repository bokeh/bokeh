from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a steps renderer
p.step([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2, mode="center")

show(p)
