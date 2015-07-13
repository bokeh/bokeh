from bokeh.plotting import figure, output_file, show
from bokeh.models import HoverTool, BoxSelectTool

output_file("toolbar.html")
TOOLS = [BoxSelectTool(), HoverTool()]

p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)

show(p)
