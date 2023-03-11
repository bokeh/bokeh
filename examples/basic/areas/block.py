from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.block(x=[1, 2, 3], y=[1, 2, 3], width=[0.2, 0.5, 0.1], height=1.5)

show(p)
