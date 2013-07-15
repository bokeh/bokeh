import numpy as np
from bokeh.plotting import *

x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("line example")
line(x,y, color="#0000FF", tools="pan,zoom,resize")
plot(x,y, color="black", tools="pan,zoom,resize")
