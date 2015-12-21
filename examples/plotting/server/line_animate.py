import numpy as np
from numpy import pi

from bokeh.plotting import figure, curdoc
from bokeh.client import push_session
from bokeh.driving import cosine

x = np.linspace(0, 4*pi, 80)
y = np.sin(x)

p = figure()
r1 = p.line([0, 4*pi], [-1, 1], color="firebrick")
r2 = p.line(x, y, color="navy", line_width=4)

# open a session to keep our local document in sync with server
session = push_session(curdoc())

@cosine(w=0.03)
def update(step):
    r2.data_source.data["y"] = y * step
    r2.glyph.line_alpha = 1 - 0.8 * abs(step)

curdoc().add_periodic_callback(update, 50)

session.show() # open the document in a browser

session.loop_until_closed() # run forever