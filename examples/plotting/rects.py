# The plot server must be running

import numpy as np
from bokeh.plotting import *

x = np.linspace(-7, 7, 60)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
#output_server("rect example")
output_file("rects.html", title="Rectangles")
rects(x,y, 1, 0.5, color="#FF0000", tools="pan,zoom,save,resize")
save()

# You can set the x, y, width, and height to arrays or to constant values
rects(np.arange(60), np.sin(x), 2, 0.1*np.cos(x), color="green",
        line_color="none", tools="pan,zoom,resize")
show()
