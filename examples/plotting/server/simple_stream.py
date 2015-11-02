# The plot server must be running. To start the server, run
#   $ bokeh-server
# If you don't wish to persist the data/objects from this plot,
# then a faster backend is the "memory" backend:
#   $ bokeh-server --backend=memory
# Go to http://localhost:5006/bokeh to view this plot

import time

import numpy as np

from bokeh.plotting import figure, show, output_server, curdoc
from bokeh.models import GlyphRenderer
from bokeh.client import push_session

x = np.linspace(0, 4*np.pi, 200)
y = np.sin(x)

output_server("simple_stream")

p = figure(title="Simple streaming example")
p.line(x,y, color="#2222aa", line_width=2)

# Open a session which will keep our local doc in sync with server
session = push_session(curdoc())
# Open the session in a browser
session.show()

ds = p.select({"type": GlyphRenderer})[0].data_source
while True:
    oldx = ds.data["x"]
    newx = np.hstack([oldx, [oldx[-1] + 4*np.pi/200]])
    ds.data["x"] = newx
    ds.data["y"] = np.sin(newx)

    time.sleep(0.10)
