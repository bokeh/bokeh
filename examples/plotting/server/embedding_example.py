# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from __future__ import print_function
import numpy as np
from bokeh.plotting import *
from bokeh.session import Session
import bokeh.embed as embed

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_server("line")
plot = line(x,y, color="#0000FF", tools="pan,wheel_zoom,box_zoom,reset,previewsave")
plot2 = line(x,y, color="red", tools="pan,wheel_zoom,box_zoom,reset,previewsave")
tag = embed.autoload_server(plot, cursession())
tag2 = embed.autoload_server(plot2, cursession())
html = \
"""
<html>
<head></head>
<body>
%s
%s
</body>
</html>
"""
html = html % (tag, tag2)
with open("embed.html", "w+") as f:
    f.write(html)
print("To view this example, start the python simple http server in this directory with `python -m SimpleHTTPServer' and then navigate to `http://localhost:8000/embed.html'")
#show()
