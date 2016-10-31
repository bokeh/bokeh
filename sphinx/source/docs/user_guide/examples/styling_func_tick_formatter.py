from bokeh.models import FuncTickFormatter
from bokeh.plotting import figure, show, output_file

output_file("formatter.html")

p = figure(plot_width=500, plot_height=500)
p.circle([0, 2, 4, 6, 8, 10], [6, 2, 4, 10, 8, 0], size=30)

p.yaxis.formatter = FuncTickFormatter(code="""
    return Math.floor(tick) + " + " + (tick % 1).toFixed(2)
""")

show(p)
