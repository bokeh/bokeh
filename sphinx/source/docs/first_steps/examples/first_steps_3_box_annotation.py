import random

from bokeh.models import BoxAnnotation
from bokeh.plotting import figure, show

# generate some data (1-50 for x, random values for y)
x = list(range(0, 51))
y = random.sample(range(0, 100), 51)

# create new plot
p = figure(title="Box annotation example")

# add line renderer
line = p.line(x, y, line_color="blue", line_width=2)

# add box annotations
low_box = BoxAnnotation(top=20, fill_alpha=0.1, fill_color="red")
mid_box = BoxAnnotation(bottom=20, top=80, fill_alpha=0.1, fill_color="green")
high_box = BoxAnnotation(bottom=80, fill_alpha=0.1, fill_color="red")

# add boxes to existing figure
p.add_layout(low_box)
p.add_layout(mid_box)
p.add_layout(high_box)

# show the results
show(p)
