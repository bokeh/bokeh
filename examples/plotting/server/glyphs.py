# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 9

x = np.linspace(-2, 2, N)
y = x**2

output_server("glyph.py examples")

annular_wedge(x, y, 10, 20, 0.6, 4.1, color="#8888ee", tools="pan,zoom,resize", title="annular_wedge")
annulus(x, y, 10, 20, color="#8888ee", tools="pan,zoom,resize", title="annulus")
circles(x, y, 10, color="#8888ee", tools="pan,zoom,resize", title="circles")
line(x, y, color="#8888ee", tools="pan,zoom,resize", title="line")
oval(x, y, 15, 25, -0.7, color="#8888ee", tools="pan,zoom,resize", title="oval")
ray(x, y, 45, -0.7, color="#8888ee", tools="pan,zoom,resize", title="ray")
quad(x, x-0.5, y, y-0.5, color="#8888ee", tools="pan,zoom,resize", title="quad")
rects(x, y, 10, 20, -0.7, color="#8888ee", tools="pan,zoom,resize", title="rects")
segment(x, y, x-0.1, y-0.1, color="#8888ee", tools="pan,zoom,resize", title="segment")
squares(x, y, 20, color="#8888ee", tools="pan,zoom,resize", title="squares")
wedge(x, y, 15, 0.6, 4.1, color="#8888ee", tools="pan,zoom,resize", title="wedge")
