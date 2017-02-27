from bokeh.plotting import figure, show

p = figure(plot_width=400, plot_height=400)
p.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=0.2, start_angle=0.4, end_angle=4.8,
        color="firebrick", alpha=0.6, direction="clock")

show(p)
