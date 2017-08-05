from bokeh.plotting import figure, show

p = figure(plot_width=400, plot_height=400)
p.annulus(x=[1, 2, 3], y=[1, 2, 3], inner_radius=0.1, outer_radius=0.25,
          color="orange", alpha=0.6)

show(p)
