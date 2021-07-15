import numpy as np

from bokeh.plotting import figure, output_file, show

x = np.linspace(0, 4*np.pi, 100)
y = np.cos(x)

output_file("legend_item_visibility.html")

p = figure(height=300)

# create two renderers with legend labels
main = p.circle(x, y, legend_label="Main")
aux = p.line(x, 2*y, legend_label="Auxillary",
             line_dash=[4, 4], line_color="orange", line_width=2)

# set legend label visibility for second renderer to False
p.legend.items[1].visible = False

show(p)
