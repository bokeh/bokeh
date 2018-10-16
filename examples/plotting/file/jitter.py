from bokeh.layouts import column
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.autompg import autompg
from bokeh.transform import jitter

years = sorted(autompg.yr.unique())

p1 = figure(plot_width=600, plot_height=300, title="Years vs mpg without jittering")
p1.xgrid.grid_line_color = None
p1.xaxis[0].ticker = years
p1.circle(x='yr', y='mpg', size=9, alpha=0.4, source=autompg)

p2 = figure(plot_width=600, plot_height=300, title="Years vs mpg with jittering")
p2.xgrid.grid_line_color = None
p2.xaxis[0].ticker = years
p2.circle(x=jitter('yr', 0.4), y='mpg', size=9, alpha=0.4, source=autompg)

output_file("jitter.html")

show(column(p1, p2))
