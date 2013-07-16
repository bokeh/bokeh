# The plot server must be running

import numpy as np
from bokeh.plotting import *

x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("color example")
hold(True)
scatter(x,y, tools="pan,zoom,resize")
scatter(x,2*y, tools="pan,zoom,resize")
scatter(x,3*y, tools="pan,zoom,resize")

figure()

plot(x,y, tools="pan,zoom,resize")
plot(x,2*y, tools="pan,zoom,resize")
plot(x,3*y, tools="pan,zoom,resize")
