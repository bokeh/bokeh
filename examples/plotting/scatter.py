# The plot server must be running

import numpy as np
from bokeh.plotting import *

x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("scatter example")
scatter(x,y, color="#FF0000", tools="pan,zoom,resize")

# This will be saved in scatter.html
output_file("scatter.html", title="Peter Plot")
scatter(x,y, color="green", tools="pan,zoom")
