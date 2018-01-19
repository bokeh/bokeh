from bokeh.plotting import figure, output_file, show
from bokeh.models import PolyDrawTool, ColumnDataSource

output_file("tools_poly_draw.html")

p = figure(x_range=(0, 10), y_range=(0, 10), width=400, height=400)

p1 = p.patches([[2, 5, 8]], [[2, 8, 2]], line_width=0, alpha=0.4)
l1 = p.multi_line([[1, 9]], [[5, 5]], line_width=5, alpha=0.4, color='red')

p.add_tools(PolyDrawTool(renderers=[p1]), PolyDrawTool(renderers=[l1]))

show(p)
