from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.annular_wedge(x=[1, 2, 3], y=[1, 2, 3], inner_radius=0.1, outer_radius=0.25,
                start_angle=0.4, end_angle=4.8, color="green", alpha=0.6)

show(p)
