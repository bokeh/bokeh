from quickstart_examples import *

# output to static HTML file
output_file("lines.html")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
line(arch_x, arch_y, color="red", line_width=2, title="Archimean", legend="Archimedean")

show()
