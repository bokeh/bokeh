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

# we create 19 new lists of y-values to use them as steps in our animation
values = []
for i in range(1, 20):
    values.append([y_ ** i for y_ in y])

while True:
    # now we update the y column in the datasource with each y-value list in the values list
    for val in values:
        ds.data["y"] = val
        cursession().store_objects(ds)
        time.sleep(0.1)

    # and now we go back to the initial state just reversing the values list
    for val in values[::-1]:
        ds.data["y"] = val
        cursession().store_objects(ds)
        time.sleep(0.1)