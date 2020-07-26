from bokeh.models import NumeralTickFormatter
from bokeh.plotting import figure, output_file, show

output_file("gridlines.html")

p = figure(plot_width=400, plot_height=400)
p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

p.x_axis[0].formatter = NumeralTickFormatter(format="0.0%")
p.y_axis[0].formatter = NumeralTickFormatter(format="$0.00")

show(p)
