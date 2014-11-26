import time
from bokeh.plotting import figure, output_server, cursession, show

#prepare some data
x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]

# output to static HTML file
output_server("animated_line")

# Plot a `line` renderer setting the color, line thickness, title, and legend value.
p = figure(title="One Line")
p.line(x, y, legend="Temp.", x_axis_label='x', y_axis_label='y', name='example1')

show(p)

# create some simple animation..
# first get our figure example data source
renderer = p.select(dict(name="example1"))
ds = renderer[0].data_source

# now all we need to do is update the y values in that data source and
# the the current session to store the change
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