import random

from bokeh.plotting import figure, show

# generate some data (1-10 for x, random values for y)
x = list(range(0, 26))
y = random.sample(range(0, 100), 26)

# generate list of rgb hex colors in relation to y
colors = ["#%02x%02x%02x" % (255, int(round(value * 255 / 100)), 255) for value in y]

# create new plot
p = figure(
    title="Vectorized colors example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add circle and line renderers
line = p.line(x, y, line_color="blue", line_width=1)
circle = p.circle(x, y, fill_color=colors, line_color="blue", size=15)

# show the results
show(p)
