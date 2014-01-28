
import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("scatter.html", title="scatter.py example")

scatter(x,y, color="#FF00FF", tools="pan,wheel_zoom,resize, select", 
        nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)
scatter(x,y, color="red", tools="pan,wheel_zoom,resize, select")
scatter(x,y, type="square", color="green", tools="pan,wheel_zoom,resize")
scatter(x,y, type="square", color="blue", tools="pan,wheel_zoom,resize",
        name="scatter_example")

show()  # open a browser
