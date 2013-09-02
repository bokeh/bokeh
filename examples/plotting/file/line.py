import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("line.html", title="Line")

line(x,y, color="#0000FF", tools="pan,zoom,resize")

# open a browser
show()
