from __future__ import print_function

import random

from bokeh.plotting import figure
from bokeh.client import push_session
from bokeh.io import curdoc

data = lambda: [ random.choice([ i for i in range(100) ]) for r in range(10) ]

p = figure(sizing_mode='scale_both', tools='pan', plot_width=600, plot_height=400)
p.scatter(data(), data(), color="red", size=12, alpha=0.5)

def show_inner_dimensions():
    print("plot's inner dimensions (width x height): %s x %s [px]" % (p.inner_width, p.inner_height))

show_inner_dimensions()

p.on_change("inner_width", lambda attr, old, new: show_inner_dimensions())
p.on_change("inner_height", lambda attr, old, new: show_inner_dimensions())

session = push_session(curdoc())
session.show(p)
session.loop_until_closed()
