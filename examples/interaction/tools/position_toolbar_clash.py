from bokeh.plotting import figure, show

p = figure(width=400, height=400,
           title=None, toolbar_location="below")

p.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
