from bokeh.models import PrintfTickFormatter
from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis[0].formatter = PrintfTickFormatter(format="%4.1e")
p.yaxis[0].formatter = PrintfTickFormatter(format="%5.3f mu")

show(p)
