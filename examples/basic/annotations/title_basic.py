from bokeh.plotting import figure, show

p = figure(title="Basic Title", width=300, height=300)

p.circle([1,2], [3,4])

show(p)
