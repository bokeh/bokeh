from bokeh.io import show, output_file
from bokeh.plotting import figure
from bokeh.core.enums import HatchPattern

output_file("hatch_patterns.html")

pats = list(HatchPattern)
lefts  = [3,  4, 6,  5, 3, 7, 4,  5, 3,  4,  7,  5, 6,  4, 5, 6, 8]
scales = [12, 6, 12, 4, 8, 4, 10, 8, 18, 16, 12, 8, 12, 8, 6, 8, 12]

p = figure(y_range=pats, plot_height=900, plot_width=600, title="Built-in Hatch Patterns",
           toolbar_location=None, tools="", y_axis_location="right")

r = p.hbar(y=pats, left=lefts, right=10, height=0.9, fill_color="#fafafa", line_color="grey",
       hatch_pattern=pats, hatch_scale=scales, hatch_color="black", hatch_weight=0.5, hatch_alpha=0.5)

p.ygrid.grid_line_color = None
p.x_range.end = 10

show(p)
