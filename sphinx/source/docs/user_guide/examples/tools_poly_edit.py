from bokeh.plotting import figure, output_file, show
from bokeh.models import PolyDrawTool, PolyEditTool

output_file("tools_poly_edit.html")

p = figure(x_range=(0, 10), y_range=(0, 10),
           width=400, height=400)

l1 = p.patches([], [], fill_alpha=0.4)
l2 = p.patches([[1, 2, 3]], [[3, 5, 2]], fill_color='green', fill_alpha=0.4)
c1 = p.circle([], [], size=10, color='red')

p.add_tools(
    PolyDrawTool(renderers=[l1, l2]),
    PolyEditTool(renderers=[l1, l2], vertex_renderer=c1)
)

show(p)
