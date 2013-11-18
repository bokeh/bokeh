import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("line.html", title="line.py example")

line(x,y, color="#0000FF", tools="pan,zoom,resize",
     name="line_example")

show()
