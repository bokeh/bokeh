import time
from bokeh.plotting import *
from bokeh.objects import GlyphRenderer

#prepare some data
x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]

# output to static HTML file
output_server("animated_line")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
line(x, y, title="One Line", legend="Temp.", x_axis_label='x', y_axis_label='y')

show()

# create some simple animation
renderer = [r for r in curplot().renderers if isinstance(r, GlyphRenderer)][0]
ds = renderer.data_source

while True:
    values = []
    for i in range(1, 20):
        new_values = ds.data["y"] = [y_ ** i for y_ in y]
        cursession().store_objects(ds)
        time.sleep(0.1)
        values.append(new_values)

    for new_values in values[::-1]:
        ds.data["y"] = new_values
        cursession().store_objects(ds)
        time.sleep(0.1)