from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.arc(x=[1, 2, 3], y=[1, 2, 3], radius=0.1, start_angle=0.4, end_angle=4.8, color="navy")

show(p)
