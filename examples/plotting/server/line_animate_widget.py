from __future__ import print_function

import time
import logging
from threading import Thread

import numpy as np

from bokeh.models.widgets import Button
from bokeh.plotting import (
    figure, show,  output_server, curdoc, vplot,  hplot
)
from bokeh.client import push_session

logger = logging.getLogger(__name__)

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("line_animate_widget")

p = figure()

p.line(x, y, color="#3333ee", name="sin")
p.line([0,4*np.pi], [-1, 1], color="#ee3333")

# Open a session which will keep our local doc in sync with server
session = push_session(curdoc())

def play_handler():
    print("button_handler: start click")
    global play
    play = True

def stop_handler():
    print("button_handler: stop click")
    global play
    play = False

play = True

button_start = Button(label="Start", type="success")
button_start.on_click(play_handler)

button_stop = Button(label="Stop", type="danger")
button_stop.on_click(stop_handler)

controls = hplot(button_start, button_stop)
layout = vplot(controls, p)

# Open the session in a browser
session.show(layout)


renderer = p.select(dict(name="sin"))
ds = renderer[0].data_source

def should_play():
    """Return true if we should play animation, otherwise block"""
    global play
    while True:
        if play:
            return True
        else:
            time.sleep(0.05)

def background_thread(ds):
    # """Plot animation, update data if play is True, otherwise stop"""
    try:
        while True:
            print ("IN!!!")
            for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
                if should_play():
                    ds.data["y"] = y * i
                    # TODO this is a Bokeh bug workaround: Document
                    # doesn't notice that we assigned to 'ds.data'
                    ds.trigger('data', ds.data, ds.data)
                time.sleep(0.05)
    except:
        logger.exception("An error occurred")
        raise

# spin up a background thread with animation
# Thread(target=background_thread, args=(ds,)).start()



# endlessly poll to check widgets
# cursession().poll_document(curdoc(), 0.05)
session.loop_until_closed()
