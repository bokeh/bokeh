import numpy as np
from bokeh.models import Legend, LegendItem
from bokeh.plotting import figure, show, output_file

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

output_file("legend_labels.html")

p = figure(toolbar_location="above")

r0 = p.circle(x, y)
r1 = p.line(x, y)

r2 = p.line(x, 2*y, line_dash=[4, 4], line_color="orange", line_width=2)

r3 = p.square(x, 3*y, fill_color=None, line_color="green")
r4 = p.line(x, 3*y, line_color="green")

legend = Legend(items=[
    LegendItem(label="sin(x)", renderers=[r0, r1]),
    LegendItem(label="2*sin(x)", renderers=[r2]),
    LegendItem(label="3*sin(x)", renderers=[r3, r4])
], location=(0, -30))

p.add_layout(legend, 'right')

show(p)
