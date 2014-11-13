from quickstart_examples import *

# output to static HTML file
output_file("lines.html")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
line(x, y, title="One Line", legend="Temp.", x_axis_label='x', y_axis_label='y')

show()
