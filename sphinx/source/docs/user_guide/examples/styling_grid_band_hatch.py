from bokeh.io import output_file, show
from bokeh.plotting import figure

output_file("grid_band_hatch.html")

p = figure(plot_height=250, plot_width=600, x_range=(0, 10), tools="", toolbar_location=None)
p.line(x=[0,1,2,3,4,5,6,7,8,9,10],
       y=[1,3,4,3,1,2,6,5,2,3,4])

p.ygrid.grid_line_color = None

ticks = [0, 2, 4, 6, 8, 10]
p.xaxis[0].ticker = ticks
p.xgrid[0].ticker = ticks

p.xgrid.band_hatch_pattern = "/"
p.xgrid.band_hatch_alpha = 0.6
p.xgrid.band_hatch_color = "lightgrey"
p.xgrid.band_hatch_weight = 0.5
p.xgrid.band_hatch_scale = 10

show(p)
