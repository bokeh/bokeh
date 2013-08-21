import numpy as np
from bokeh.plotting import *

x = np.linspace(-2, 2, 7)
y = x**2



# Go to http://localhost:5006/bokeh to view this plot
output_server("examples")
annular_wedge(x, y, 10, 20, 0.6, 4.1, color="#8888ee", tools="pan,zoom,resize")
annulus(x, y, 10, 20, color="#8888ee", tools="pan,zoom,resize")
# bezier(x, y, 13, 0, 2.6, color="#0000FF", tools="pan,zoom,resize")
circles(x, y, 10, color="#8888ee", tools="pan,zoom,resize")
line(x, y, color="#8888ee", tools="pan,zoom,resize")
# multiline(x, y, 13, 0, 2.6, color="#0000FF", tools="pan,zoom,resize")
oval(x, y, 15, 25, -0.7, color="#8888ee", tools="pan,zoom,resize")
ray(x, y, -0.7, 45, color="#8888ee", tools="pan,zoom,resize")
# quad(y, y-1, x, x-1, color="#8888ee", tools="pan,zoom,resize")
# quad_curve(y, y-1, x, x-1, color="#8888ee", tools="pan,zoom,resize")
rects(x, y, 10, 20, -0.7, color="#8888ee", tools="pan,zoom,resize")
# seggment(y, y-1, x, x-1, color="#8888ee", tools="pan,zoom,resize")
squares(x, y, 20, color="#8888ee", tools="pan,zoom,resize")
wedge(x, y, 15, 0.6, 4.1, color="#8888ee", tools="pan,zoom,resize")