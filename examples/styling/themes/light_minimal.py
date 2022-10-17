from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'light_minimal'

p = figure(title='light_minimal', width=300, height=300)
p.line(x, y)

show(p)
