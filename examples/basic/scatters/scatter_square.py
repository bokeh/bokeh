from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a square scatter renderer with a size, color, and alpha
p.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], marker="square",
          size=20, color="olive", alpha=0.5)

# show the results
show(p)
