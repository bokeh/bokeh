import numpy as np
from bokeh.models import Legend
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
    ("sin(x)"   , [r0, r1]),
    ("2*sin(x)" , [r2]),
    ("3*sin(x)" , [r3, r4]),
], location=(0, -30))

p.add_layout(legend, 'right')

show(p)
