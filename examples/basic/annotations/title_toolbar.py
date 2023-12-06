from bokeh.plotting import figure, show

p = figure(title="Top Title with Toolbar", toolbar_location="above",
           width=600, height=300)

p.scatter([1, 2], [3, 4])

show(p)
