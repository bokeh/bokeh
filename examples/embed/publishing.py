# The plot server must be running
# The server must run with --multi-user for this example to work
# Go to http://localhost:5006/bokeh to view this plot

import time

import numpy as np

from bokeh.plotting import *
from bokeh.session import Session
from bokeh import embed
Session().register('testuser', 'testpassword')
N = 80
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
output_server("line_animate")
TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"
p = figure(tools=TOOLS)
p.circle(x, y, color="#3333ee", name="sin")
push()
renderer = p.select(dict(name="sin"))
ds = renderer[0].data_source
cursession().publish()
tag = embed.autoload_server(p, cursession(), public=True)
html = """
<html>
<head></head>
<body>
%s
</body>
</html>
"""
html = html % (tag)
with open("publishing.html", "w+") as f:
    f.write(html)
while True:
    for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
        ds.data["y"] = y * i
        cursession().store_objects(ds)
        time.sleep(1.0)
