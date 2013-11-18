
import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("scatter.html", title="scatter.py example")

scatter(x,y, color="#FF00FF", tools="pan,zoom,resize")
scatter(x,y, color="red", tools="pan,zoom,resize")
scatter(x,y, type="square", color="green", tools="pan,zoom,resize")
scatter(x,y, type="square", color="blue", tools="pan,zoom,resize",
        name="scatter_example")

show()  # open a browser
