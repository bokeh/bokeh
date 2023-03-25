from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'night_sky'

p = figure(title='night_sky', width=300, height=300)
p.line(x, y)

show(p)
