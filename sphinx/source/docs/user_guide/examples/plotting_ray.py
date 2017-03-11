from bokeh.plotting import figure, show

p = figure(plot_width=400, plot_height=400)
p.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=[30, 45, 60],
      angle_units="deg", color="#FB8072", line_width=2)

show(p)
