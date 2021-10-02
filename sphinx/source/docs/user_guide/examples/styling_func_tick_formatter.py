from bokeh.models import CustomJSTickFormatter
from bokeh.plotting import figure, output_file, show

output_file("formatter.html")

p = figure(width=500, height=500)
p.circle([0, 2, 4, 6, 8, 10], [6, 2, 4, 10, 8, 0], size=30)

p.yaxis.formatter = CustomJSTickFormatter(code="""
    return Math.floor(tick) + " + " + (tick % 1).toFixed(2)
""")

show(p)
