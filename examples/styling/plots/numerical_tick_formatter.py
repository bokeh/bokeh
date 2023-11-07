from bokeh.models import NumeralTickFormatter
from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis[0].formatter = NumeralTickFormatter(format="0.0%")
p.yaxis[0].formatter = NumeralTickFormatter(format="$0.00")

show(p)
