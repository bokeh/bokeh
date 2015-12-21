import numpy as np
from numpy import pi

from bokeh.client import push_session
from bokeh.models.widgets import Button
from bokeh.plotting import figure, curdoc, vplot,  hplot
from bokeh.driving import cosine

x = np.linspace(0, 4*pi, 100)
y = np.sin(x)

p = figure()
r1 = p.line([0, 4*pi], [-1, 1], color="firebrick")
r2 = p.line(x, y, color="navy", line_width=4)

# open a session to keep our local document in sync with server
session = push_session(curdoc())

def start_handler():
    global playing
    if not playing:
        curdoc().add_periodic_callback(update, 50)
        playing = True

def stop_handler():
    global playing
    if playing:
        curdoc().remove_periodic_callback(update)
        playing = False

button_start = Button(label="Start", type="success")
button_start.on_click(start_handler)

button_stop = Button(label="Stop", type="danger")
button_stop.on_click(stop_handler)

controls = hplot(button_start, button_stop)
layout = vplot(controls, p)

@cosine(w=0.03)
def update(step):
    if playing:
        r2.data_source.data["y"] = y * step
        r2.glyph.line_alpha = 1 - 0.8 * abs(step)

playing = True
curdoc().add_periodic_callback(update, 50)

session.show() # open the document in a browser

session.loop_until_closed() # run forever

